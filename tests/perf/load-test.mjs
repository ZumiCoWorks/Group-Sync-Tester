#!/usr/bin/env node
import { performance } from 'node:perf_hooks';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
const concurrency = Number(process.env.CONCURRENCY || '6');
const requestsPerEndpoint = Number(process.env.REQUESTS_PER_ENDPOINT || '40');
const warmupRequests = Number(process.env.WARMUP_REQUESTS || '2');
const p95ThresholdMs = Number(process.env.P95_THRESHOLD_MS || '750');
const probeTimeoutMs = Number(process.env.PROBE_TIMEOUT_MS || '5000');
const failOnAnyError = (process.env.FAIL_ON_ERROR || 'true').toLowerCase() !== 'false';

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[Math.max(0, rank)];
}

function summarize(values) {
  if (values.length === 0) {
    return { min: 0, avg: 0, p50: 0, p95: 0, p99: 0, max: 0 };
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    min: Math.min(...values),
    avg: total / values.length,
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    max: Math.max(...values),
  };
}

async function fetchJson(path) {
  const response = await fetch(`${backendUrl}${path}`);
  const bodyText = await response.text();
  let parsed = null;

  if (bodyText) {
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      parsed = bodyText;
    }
  }

  return { response, body: parsed };
}

async function probeEndpoint(path) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), probeTimeoutMs);
  const startedAt = performance.now();

  try {
    const response = await fetch(`${backendUrl}${path}`, { signal: controller.signal });
    const bodyText = await response.text();
    const duration = performance.now() - startedAt;
    let body = null;

    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        body = bodyText;
      }
    }

    return {
      ok: response.ok,
      duration,
      status: response.status,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      duration: performance.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function resolveBatchId() {
  const probe = await probeEndpoint('/api/batches');
  if (!probe.ok || probe.duration > probeTimeoutMs || !probe.body?.success || !Array.isArray(probe.body.data) || probe.body.data.length === 0) {
    return null;
  }

  return probe.body.data[0].id || null;
}

async function warmUp(path) {
  for (let index = 0; index < warmupRequests; index += 1) {
    try {
      const { response } = await fetchJson(path);
      if (!response.ok) {
        break;
      }
    } catch {
      break;
    }
  }
}

async function loadEndpoint(name, path) {
  await warmUp(path);

  const latencies = [];
  const errors = [];
  let nextRequest = 0;
  const workerCount = Math.max(1, Math.min(concurrency, requestsPerEndpoint));

  async function worker() {
    while (true) {
      const current = nextRequest;
      nextRequest += 1;

      if (current >= requestsPerEndpoint) {
        return;
      }

      const startedAt = performance.now();

      try {
        const { response } = await fetchJson(path);
        const duration = performance.now() - startedAt;
        latencies.push(duration);

        if (!response.ok) {
          errors.push(`HTTP ${response.status}`);
        }
      } catch (error) {
        latencies.push(performance.now() - startedAt);
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const summary = summarize(latencies);
  return {
    name,
    path,
    requests: requestsPerEndpoint,
    errors,
    summary,
  };
}

const startedAt = Date.now();
const batchId = await resolveBatchId();
const candidateEndpoints = [
  { name: 'health', path: '/api/health' },
  { name: 'batches', path: '/api/batches' },
];

if (batchId) {
  candidateEndpoints.push({ name: 'batch detail', path: `/api/batches/${batchId}` });
  candidateEndpoints.push({ name: 'batch slots', path: `/api/batches/${batchId}/slots` });
}

console.log(`Performance test target: ${backendUrl}`);
console.log(`Concurrency: ${concurrency}, requests per endpoint: ${requestsPerEndpoint}`);
console.log(batchId ? `Benchmarking with batch ${batchId}` : 'No batch found, running public endpoint benchmarks only');

const results = [];
for (const endpoint of candidateEndpoints) {
  const probe = await probeEndpoint(endpoint.path);

  if (!probe.ok || probe.duration > probeTimeoutMs) {
    console.log(
      `Skipping ${endpoint.name} (${endpoint.path}) after probe: ` +
        (probe.error || `status ${probe.status}, ${probe.duration.toFixed(1)}ms`)
    );
    continue;
  }

  console.log(`Running ${endpoint.name} (${endpoint.path})...`);
  const result = await loadEndpoint(endpoint.name, endpoint.path);
  results.push(result);
}

const totalDuration = (Date.now() - startedAt) / 1000;
const failures = results.filter((result) => result.errors.length > 0 || result.summary.p95 > p95ThresholdMs);

console.log('\nResults');
console.log('-------');
for (const result of results) {
  const { summary } = result;
  const errorRate = result.requests === 0 ? 0 : (result.errors.length / result.requests) * 100;
  console.log(
    `${result.name.padEnd(13)} ` +
      `avg=${summary.avg.toFixed(1)}ms ` +
      `p50=${summary.p50.toFixed(1)}ms ` +
      `p95=${summary.p95.toFixed(1)}ms ` +
      `p99=${summary.p99.toFixed(1)}ms ` +
      `max=${summary.max.toFixed(1)}ms ` +
      `errors=${result.errors.length} (${errorRate.toFixed(1)}%)`
  );
}

if (results.length === 0) {
  console.log('No endpoints completed the benchmark probe.');
  process.exit(0);
}

console.log(`\nTotal wall time: ${totalDuration.toFixed(1)}s`);
console.log(`Threshold: p95 <= ${p95ThresholdMs}ms`);

if (failOnAnyError && failures.length > 0) {
  console.error('\nLoad test failed thresholds:');
  for (const failure of failures) {
    const reasons = [];
    if (failure.errors.length > 0) {
      reasons.push(`errors=${failure.errors.length}`);
    }
    if (failure.summary.p95 > p95ThresholdMs) {
      reasons.push(`p95=${failure.summary.p95.toFixed(1)}ms`);
    }
    console.error(`- ${failure.name}: ${reasons.join(', ')}`);
  }
  process.exit(1);
}

console.log('\nLoad test passed.');
