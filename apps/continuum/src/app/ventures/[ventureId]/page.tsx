import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ActionLink, Alert, DataTable, DemoBanner, EmptyState, PageHeader, Section, SourceBadge, StatusBadge } from '@afda/continuum-ui';
import { activity, assessments, ventures } from '@/lib/demo-data';
import { demoPersonas, resolveDemoPersona, type DemoPersonaId } from '@/lib/demo-personas';

export function generateStaticParams() {
  return ventures.map((venture) => ({ ventureId: venture.id }));
}

function contextHref(path: string, ventureId: string, persona: DemoPersonaId, values: Record<string, string> = {}) {
  return `${path}?${new URLSearchParams({ ventureId, persona, ...values }).toString()}`;
}

function ContextAction({ href, children, disabledReason }: { href?: string; children: ReactNode; disabledReason?: string }) {
  if (!href) {
    return <span className="continuum-action-disabled" aria-disabled="true" title={disabledReason}>{children}<small>{disabledReason}</small></span>;
  }
  return <a className="continuum-text-action" href={href}>{children}<span aria-hidden="true">→</span></a>;
}

function primaryHref(action: string, ventureId: string, persona: DemoPersonaId) {
  if (action === 'production') return '#production-activity';
  if (action === 'spaces') return contextHref('/spaces', ventureId, persona, { intent: 'review-request' });
  if (action === 'registry') return contextHref('/registry', ventureId, persona, { intent: 'resolve-blockers' });
  return contextHref('/learning', ventureId, persona, { intent: 'review-assessment' });
}

const registryReaders: DemoPersonaId[] = ['senior_tutor', 'lecturer', 'registry', 'admin'];
const registryOperators: DemoPersonaId[] = ['registry', 'admin'];
const peopleManagers: DemoPersonaId[] = ['senior_tutor', 'admin'];

export default async function VenturePage({ params, searchParams }: {
  params: Promise<{ ventureId: string }>;
  searchParams: Promise<{ persona?: string | string[] }>;
}) {
  const { ventureId } = await params;
  const query = await searchParams;
  const venture = ventures.find((item) => item.id === ventureId);
  if (!venture) notFound();

  const demoMode = process.env.NEXT_PUBLIC_CONTINUUM_DEMO_MODE === 'true';
  const requestedPersona = Array.isArray(query.persona) ? query.persona[0] : query.persona;
  const personaId = demoMode ? resolveDemoPersona(requestedPersona) : 'admin';
  const persona = demoPersonas[personaId];
  const detailed = venture.id === 'venture-demo-bcom-001';
  const nextMilestone = venture.milestones.find((item) => item.state === 'In progress') || venture.milestones.find((item) => item.state === 'Upcoming');
  const expiringPerson = venture.people.find((person) => person.expiresAt);
  const ventureAssessments = assessments.filter((item) => item.ventureId === venture.id);
  const visibleAssessments = personaId === 'adhoc'
    ? ventureAssessments.filter((item) => item.type === 'Specialist preview')
    : personaId === 'ops_venue_admin' ? [] : ventureAssessments;
  const canReadRegistry = registryReaders.includes(personaId);
  const canOperateRegistry = registryOperators.includes(personaId);
  const canManagePeople = peopleManagers.includes(personaId);
  const detailedVentureHref = contextHref('/ventures/venture-demo-bcom-001', 'venture-demo-bcom-001', personaId);

  return <>
    <nav className="continuum-breadcrumb" aria-label="Breadcrumb">
      <a href={contextHref('/ventures', venture.id, personaId)}>Ventures</a>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{venture.code}</span>
    </nav>

    <PageHeader
      title={venture.title}
      summary={venture.summary}
      actions={<>
        <ActionLink href={primaryHref(persona.primaryAction, venture.id, personaId)}>{persona.primaryLabel}</ActionLink>
        <ActionLink href={contextHref('/ventures', venture.id, personaId)} secondary>All Ventures</ActionLink>
      </>}
    />

    <DemoBanner>
      All records are fictional local fixtures. {demoMode ? <>Viewing as <strong>{persona.label}</strong>; changing persona updates priorities and access states only.</> : <>Persona switching is disabled; this static administrator view writes to no external system.</>}
    </DemoBanner>

    <nav className="continuum-local-nav" aria-label="On this Venture page">
      <a href="#now">Now</a>
      <a href="#people-access">People &amp; access</a>
      <a href="#production-activity">Production activity</a>
      <a href="#assessment-registry">Assessment to Registry</a>
    </nav>

    <Section id="now" title="Now">
      <div className="continuum-now">
        <div className="continuum-now__lead">
          <span>Current checkpoint</span>
          <h3>{nextMilestone?.label || 'Venture planning'}</h3>
          <p>{detailed ? 'Two records need documented resolution before lecturer moderation can close.' : 'This smaller fixture has no active blocker recorded.'}</p>
          <ActionLink href={primaryHref(persona.primaryAction, venture.id, personaId)}>{persona.primaryLabel}</ActionLink>
        </div>
        <dl className="continuum-now__ledger">
          <div><dt>Venture state</dt><dd><StatusBadge tone={venture.status === 'active' ? 'positive' : 'warning'}>{venture.status}</StatusBadge></dd></div>
          <div><dt>Next checkpoint</dt><dd>{nextMilestone ? `${nextMilestone.date} · ${nextMilestone.state}` : 'Not scheduled'}</dd></div>
          <div><dt>Registry blockers</dt><dd>{detailed ? <StatusBadge tone="warning">2 records held</StatusBadge> : <StatusBadge>No review yet</StatusBadge>}</dd></div>
          <div><dt>Temporary access</dt><dd>{expiringPerson ? `${expiringPerson.name} · ${expiringPerson.expiresAt}` : 'No expiring access'}</dd></div>
        </dl>
        <aside className="continuum-persona-brief" aria-label={`Demo authority for ${persona.label}`}>
          <span>Viewing as</span>
          <h3>{persona.label}</h3>
          <p>{persona.focus}</p>
          <dl><div><dt>Baseline role</dt><dd><code>{persona.baselineRole}</code></dd></div><div><dt>Scoped capabilities</dt><dd>{persona.capabilities.join(' · ')}</dd></div></dl>
          <small>{persona.access}</small>
        </aside>
      </div>
    </Section>

    <Section id="people-access" title="People & access">
      <div className="continuum-facts">
        <dl><dt>Academic period</dt><dd>{venture.period}</dd></dl>
        <dl><dt>Campus</dt><dd>{venture.campus}</dd></dl>
        <dl><dt>School</dt><dd>{venture.school}</dd></dl>
        <dl><dt>Disciplines</dt><dd>{venture.disciplines.join(' · ')}</dd></dl>
        <dl><dt>Membership</dt><dd>{venture.members} fictional participants</dd></dl>
        <dl><dt>Operating mode</dt><dd>{venture.mode.replaceAll('_', ' ')}</dd></dl>
      </div>
      {expiringPerson ? <Alert title="Access review due" tone="warning">{expiringPerson.name} has temporary specialist access until {expiringPerson.expiresAt}. {canManagePeople ? 'You can review the scoped contribution from this Venture.' : 'This persona can see the expiry but cannot change it.'}</Alert> : null}
      <details className="continuum-disclosure">
        <summary>View people and scoped access <span>{venture.people.length || 0} detailed records</span></summary>
        {venture.people.length ? <DataTable caption={`People and access for ${venture.title}`} columns={['DEMO identifier', 'Person', 'Role / discipline', 'Access state', 'Action']} rows={venture.people.map((person) => [
          <span className="continuum-code" key={person.id}>{person.id}</span>,
          person.name,
          <span key={`${person.id}-role`}>{person.role}{person.discipline ? <><br/><small>{person.discipline}</small></> : null}</span>,
          person.expiresAt ? <StatusBadge key={`${person.id}-access`} tone="warning">Expires {person.expiresAt}</StatusBadge> : <StatusBadge key={`${person.id}-access`} tone="positive">Demo active</StatusBadge>,
          <ContextAction key={`${person.id}-action`} href={canManagePeople ? contextHref('/admin', venture.id, personaId, { personId: person.id, intent: 'review-access' }) : undefined} disabledReason="Read-only for this demo persona">{person.expiresAt ? 'Review access' : 'View member context'}</ContextAction>,
        ])}/> : <EmptyState title="Detailed people are not expanded" action={<ActionLink href={detailedVentureHref} secondary>Open the complete demo Venture</ActionLink>}>This smaller fixture keeps only its membership total.</EmptyState>}
      </details>
    </Section>

    <Section id="production-activity" title="Production activity">
      <div className="continuum-system-grid">
        <article className="continuum-system-record">
          <SourceBadge source="Staff Schedule"/><h3>Consultations</h3><p>{venture.schedule.label}</p><StatusBadge tone="accent">{venture.schedule.state} · Demo</StatusBadge>
          <ContextAction href={contextHref('/schedule', venture.id, personaId, { intent: 'view-schedule' })}>Open Venture schedule</ContextAction>
        </article>
        <article className="continuum-system-record">
          <SourceBadge source="Group Sync"/><h3>Groups</h3><p>{venture.groups.label}</p><StatusBadge tone="positive">{venture.groups.state} · Demo</StatusBadge>
          <ContextAction href={contextHref('/groups', venture.id, personaId, { intent: 'view-groups' })}>Open Venture groups</ContextAction>
        </article>
        <article className="continuum-system-record">
          <SourceBadge source="WorkSuite"/><h3>Space &amp; resources</h3><p>{venture.space.label}</p><StatusBadge tone={venture.space.state === 'Approved' ? 'positive' : 'warning'}>{venture.space.state} · Demo</StatusBadge>
          <ContextAction href={contextHref('/spaces', venture.id, personaId, { intent: 'view-request' })}>Open space request</ContextAction>
        </article>
      </div>
      <details className="continuum-disclosure" open>
        <summary>Milestones <span>{venture.milestones.length || 0} recorded</span></summary>
        {venture.milestones.length ? <DataTable caption={`Milestones for ${venture.title}`} columns={['Date', 'Milestone', 'State', 'Action']} rows={venture.milestones.map((item) => [
          item.date,
          item.label,
          <StatusBadge key={`${item.date}-${item.label}`} tone={item.state === 'Complete' ? 'positive' : item.state === 'In progress' ? 'warning' : 'neutral'}>{item.state}</StatusBadge>,
          <ContextAction key={`${item.date}-action`} href={item.state === 'Complete' ? '#activity' : contextHref('/learning', venture.id, personaId, { milestone: item.label, intent: item.state === 'In progress' ? 'finalise' : 'review-prerequisites' })}>{item.state === 'Complete' ? 'View recorded activity' : item.state === 'In progress' ? 'Open finalisation queue' : 'Review prerequisites'}</ContextAction>,
        ])}/> : <EmptyState title="No detailed milestones" action={<ActionLink href={detailedVentureHref} secondary>Open the complete demo Venture</ActionLink>}>This planning fixture does not include a full milestone sequence.</EmptyState>}
      </details>
    </Section>

    <Section id="assessment-registry" title="Assessment to Registry">
      {visibleAssessments.length ? <DataTable caption={`Assessment workflow for ${venture.title}`} columns={['Assessment', 'Source', 'Mode', 'Authority', 'Status', 'Action']} rows={visibleAssessments.map((item) => [
        <strong key={item.id}>{item.title}</strong>,
        <SourceBadge key={`${item.id}-source`} source={item.source}/>,
        item.type,
        item.authority,
        <StatusBadge key={`${item.id}-state`} tone={item.state === 'Verified' ? 'positive' : 'warning'}>{item.state} · Demo</StatusBadge>,
        <ContextAction key={`${item.id}-action`} href={contextHref('/learning', venture.id, personaId, { assessmentId: item.id, intent: personaId === 'student' ? 'view-status' : 'review-lineage' })}>{personaId === 'student' ? 'View assessment status' : 'Review evidence and lineage'}</ContextAction>,
      ])}/> : <Alert title="Assessment controls restricted" tone="neutral">The {persona.label} view is focused on spaces and resources. Assessment evidence and result controls are not included in this fictional scope.</Alert>}

      <div className="continuum-registry-strip">
        <div><SourceBadge source="Continuum result lineage"/><h3>Registry readiness</h3><p>{detailed ? 'Two records are ready and two require a documented resolution before the demonstration export.' : 'This fixture has not entered Registry review.'}</p></div>
        <StatusBadge tone={detailed ? 'warning' : 'neutral'}>{detailed ? 'Review required · Demo' : 'Not assessed'}</StatusBadge>
        {canReadRegistry
          ? <ContextAction href={contextHref('/registry', venture.id, personaId, { intent: canOperateRegistry ? 'resolve-blockers' : 'view-readiness' })}>{canOperateRegistry ? 'Resolve held records' : 'View readiness'}</ContextAction>
          : <ContextAction disabledReason="Registry capability is not granted to this demo persona">Registry controls restricted</ContextAction>}
      </div>

      <details className="continuum-disclosure">
        <summary>Content references <span>{venture.content.length || 0} items</span></summary>
        {venture.content.length ? <DataTable caption={`Content references for ${venture.title}`} columns={['Item', 'Source', 'Status', 'Action']} rows={venture.content.map((item) => [
          item.title,
          <SourceBadge key={`${item.title}-source`} source={item.source}/>,
          <StatusBadge key={`${item.title}-state`} tone="accent">{item.state} · Demo</StatusBadge>,
          <ContextAction key={`${item.title}-action`} href={contextHref('/content', venture.id, personaId, { item: item.title, intent: 'view-reference' })}>View source reference</ContextAction>,
        ])}/> : <EmptyState title="No content references" action={<ActionLink href={detailedVentureHref} secondary>Open the complete demo Venture</ActionLink>}>This smaller fixture has no content metadata.</EmptyState>}
      </details>

      <details className="continuum-disclosure" id="activity">
        <summary>Activity history <span>{detailed ? activity.length : 0} events</span></summary>
        {detailed ? <ol className="continuum-timeline">{activity.map((item) => <li key={item.time}><time>{item.time} · Demo</time>{item.text}</li>)}</ol> : <EmptyState title="No activity history" action={<ActionLink href={detailedVentureHref} secondary>Open the complete demo Venture</ActionLink>}>The expanded lineage story is available in the primary demonstration Venture.</EmptyState>}
      </details>

      <div className="continuum-end-state">
        <div><span>Next controlled handoff</span><strong>{nextMilestone?.label || 'Establish Venture milestones'}</strong><small>{persona.access}</small></div>
        <ActionLink href={primaryHref(persona.primaryAction, venture.id, personaId)}>{persona.primaryLabel}</ActionLink>
      </div>
    </Section>
  </>;
}
