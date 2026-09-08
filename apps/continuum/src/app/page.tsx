import { ActionLink, DataTable, DemoBanner, IntegrationStatus, PageHeader, Section, StatusBadge } from '@afda/continuum-ui';
import { activity, assessments } from '@/lib/demo-data';

export default function HomePage() {
  return (
    <>
      <PageHeader eyebrow="Production venture overview" title="One operational line from teaching activity to Registry handoff." summary="Continuum connects existing AFDA tools and imported academic outcomes around the Production Venture. It does not replace Microsoft Teams or CARS in this proof of concept." actions={<><ActionLink href="/ventures/venture-demo-bcom-001">Open demo Venture</ActionLink><ActionLink href="/integrations" secondary>Review integrations</ActionLink></>} />
      <DemoBanner>All people, marks and identifiers shown here are fictional. Microsoft 365 is not connected and CARS exports are illustrative.</DemoBanner>
      <Section title="POC connection state" kicker="No live institutional integrations"><div className="continuum-grid"><IntegrationStatus provider="Microsoft 365" status="not_connected" currentMode="Fictional demo / browser file preview" futureMode="Microsoft Graph after tenant approval"/><IntegrationStatus provider="CARS" status="not_connected" currentMode="Fictional configurable CSV preview" futureMode="Institution-approved handoff"/></div></Section>
      <Section title="The Continuum line" kicker="Pre → during → post">
        <div className="continuum-grid">
          <div className="continuum-panel"><h3>Pre-Continuum · collect</h3><p>Teams classes, meetings and results; CARS roster files; Schedule, Group Sync and WorkSuite activity.</p><div className="continuum-panel__meta"><StatusBadge tone="warning">M365 not connected</StatusBadge><StatusBadge tone="accent">File import active</StatusBadge></div></div>
          <div className="continuum-panel"><h3>Continuum · reconcile</h3><p>Ventures, interdisciplinary teams, assessments, scoped authority, moderation and source lineage.</p><div className="continuum-panel__meta"><StatusBadge tone="accent">Fixture experience</StatusBadge></div></div>
          <div className="continuum-panel"><h3>Post-Continuum · hand off</h3><p>Registry validation, configurable result exports, export history and manual CARS import confirmation.</p><div className="continuum-panel__meta"><StatusBadge tone="warning">4 records held</StatusBadge><StatusBadge>Manual handoff</StatusBadge></div></div>
          <div className="continuum-panel"><h3>Authority · preserve</h3><p>Evaluation, finalisation, release, certification and export remain separate, auditable decisions.</p><div className="continuum-panel__meta"><StatusBadge tone="positive">Lineage complete</StatusBadge></div></div>
        </div>
      </Section>
      <Section title="Assessment attention" kicker="Current queue" action={<ActionLink href="/learning" secondary>View all assessments</ActionLink>}>
        <DataTable columns={['Assessment', 'Source', 'Authority', 'Progress', 'State']} rows={assessments.map((item) => [<a key={item.id} href={`/ventures/${item.ventureId}`}>{item.title}</a>, item.source, item.authority, item.completion, <StatusBadge key={`${item.id}-status`} tone={item.state === 'Verified' ? 'positive' : 'warning'}>{item.state}</StatusBadge>])} />
      </Section>
      <Section title="Recent lineage" kicker="Audit activity">
        <ol className="continuum-timeline">{activity.map((item) => <li key={item.time}><time>{item.time}</time>{item.text}</li>)}</ol>
      </Section>
    </>
  );
}
