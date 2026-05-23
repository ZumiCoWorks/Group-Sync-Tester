# Performance Tests

This folder contains a lightweight local load-test runner for the AFDA backend.

## Run

```bash
npm run perf:test
```

## Configuration

- `BACKEND_URL` - backend base URL, default `http://localhost:3001`
- `CONCURRENCY` - number of concurrent workers per endpoint, default `6`
- `REQUESTS_PER_ENDPOINT` - number of measured requests per endpoint, default `40`
- `WARMUP_REQUESTS` - warm-up requests before measurement, default `2`
- `P95_THRESHOLD_MS` - soft failure threshold for the p95 latency, default `750`
- `PROBE_TIMEOUT_MS` - probe timeout used to skip slow endpoints, default `5000`
- `FAIL_ON_ERROR` - set to `false` to ignore non-2xx responses when benchmarking

## Endpoints

The runner benchmarks these read-only endpoints:

- `GET /api/health`
- `GET /api/batches`
- `GET /api/batches/:batchId`
- `GET /api/batches/:batchId/slots`

It discovers the first available batch from `GET /api/batches` and skips the batch-specific requests if no batch is returned.

If an endpoint does not respond within the probe timeout, the runner logs it as skipped instead of failing the whole benchmark. This keeps the check usable when the backend has slow or unavailable database-backed routes in local development.
