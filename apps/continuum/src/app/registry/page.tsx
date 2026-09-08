import { DemoBanner, Metric, PageHeader, Section } from '@afda/continuum-ui';
import { RegistryExport } from '@/components/registry-export';

export default function RegistryPage() {
  return <><PageHeader eyebrow="Post-Continuum handoff" title="Registry & Reporting" summary="Validate final results, preview configurable output and create versioned export batches for manual CARS import. No direct CARS write is performed." /><DemoBanner>The columns and records are fictional. AFDA must supply and approve the official CARS import template before compatibility can be claimed.</DemoBanner><div className="continuum-metrics"><Metric label="Certified results" value="2" tone="positive"/><Metric label="Awaiting finalisation" value="1" tone="warning"/><Metric label="In moderation" value="1" tone="warning"/><Metric label="Blocking duplicates" value="0" tone="accent"/></div><Section title="Result readiness and export preview" kicker="Configurable demonstration"><RegistryExport /></Section></>;
}
