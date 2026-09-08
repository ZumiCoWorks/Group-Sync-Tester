import { ActionLink, DataTable, DemoBanner, PageHeader, StatusBadge } from '@afda/continuum-ui';
import { ventures } from '@/lib/demo-data';

export default function VenturesPage() {
  return <><PageHeader eyebrow="Central production context" title="Production Ventures" summary="Each Venture relates people, operational records, teaching activity, assessment authority and Registry outputs without rewriting its source systems." actions={<ActionLink href="/integrations">Import source data</ActionLink>} /><DemoBanner>Three fictional Ventures demonstrate Microsoft-first and Hybrid operating modes.</DemoBanner><DataTable columns={['Venture', 'School / period', 'Mode', 'People', 'Status']} rows={ventures.map((venture) => [<span key={venture.id}><a href={`/ventures/${venture.id}`}><strong>{venture.title}</strong></a><br/><small className="continuum-code">{venture.code}</small></span>, <span key={`${venture.id}-school`}>{venture.school}<br/><small>{venture.period}</small></span>, venture.mode.replace('_', ' '), venture.members, <StatusBadge key={`${venture.id}-state`} tone={venture.status === 'active' ? 'positive' : 'warning'}>{venture.status}</StatusBadge>])} /></>;
}
