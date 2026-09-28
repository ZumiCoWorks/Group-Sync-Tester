'use client';

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Database,
  ExternalLink,
  Eye,
  LayoutDashboard,
  Link2,
  MapPin,
  MonitorPlay,
  RefreshCcw,
  SlidersHorizontal,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import styles from './presentation.module.css';
import {
  academicPeriod,
  assessment,
  assessments,
  disciplines,
  previewCopy,
  serviceLinks,
  team,
  type PresentationView,
  type PreviewRole,
} from '@/lib/presentation-data';

const DEMO_STATE_KEY = 'continuum-conference-demo-v1';

type PilotConfig = {
  academicPeriod: string;
  workspace: string;
  purpose: string;
  teamRule: string;
  services: {
    groups: boolean;
    schedule: boolean;
    spaces: boolean;
  };
};

type DemoState = {
  pilotConfigured: boolean;
  pilotConfig: PilotConfig;
  assessorAssigned: boolean;
  baGroupSyncEnabled: boolean;
};

const defaultPilotConfig: PilotConfig = {
  academicPeriod: 'Term 3 · 2026',
  workspace: 'BCom',
  purpose: 'Multidisciplinary team learning',
  teamRule: 'One student from each BCom discipline',
  services: { groups: true, schedule: true, spaces: true },
};

const initialDemoState: DemoState = {
  pilotConfigured: false,
  pilotConfig: defaultPilotConfig,
  assessorAssigned: false,
  baGroupSyncEnabled: false,
};

const navigation: Array<{ id: PresentationView; label: string; detail: string; duration: string; icon: typeof LayoutDashboard }> = [
  { id: 'setup', label: 'Pilot inputs', detail: 'Enter period, scope and services', duration: '45 sec', icon: SlidersHorizontal },
  { id: 'home', label: 'Institution result', detail: 'See what those inputs create', duration: '35 sec', icon: LayoutDashboard },
  { id: 'bcom', label: 'BCom blueprint', detail: 'Team rule and source records', duration: '60 sec', icon: BriefcaseBusiness },
  { id: 'assessment', label: 'Assessment setup', detail: 'Inputs, access and preview', duration: '90 sec', icon: BookOpen },
  { id: 'other-school', label: 'School services', detail: 'Enable an existing service', duration: '60 sec', icon: Building2 },
  { id: 'cross-school', label: 'Cross-school', detail: 'Shared project boundary', duration: '45 sec', icon: Users },
];

function readDemoState(): DemoState {
  if (typeof window === 'undefined') return initialDemoState;
  try {
    const stored = window.localStorage.getItem(DEMO_STATE_KEY);
    if (!stored) return initialDemoState;
    const parsed = JSON.parse(stored) as Partial<DemoState>;
    return {
      ...initialDemoState,
      ...parsed,
      pilotConfig: {
        ...defaultPilotConfig,
        ...parsed.pilotConfig,
        services: { ...defaultPilotConfig.services, ...parsed.pilotConfig?.services },
      },
    };
  } catch {
    return initialDemoState;
  }
}

export default function PresentationPage() {
  const [view, setView] = useState<PresentationView>('setup');
  const [previewRole, setPreviewRole] = useState<PreviewRole>('orchestrator');
  const [demoState, setDemoState] = useState<DemoState>(initialDemoState);
  const [assessorFormOpen, setAssessorFormOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => setDemoState(readDemoState()), []);

  function updateDemoState(next: DemoState, message: string) {
    setDemoState(next);
    window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(next));
    setToast(message);
    window.setTimeout(() => setToast(''), 3500);
  }

  function navigate(nextView: PresentationView) {
    setView(nextView);
    setPreviewRole('orchestrator');
    setAssessorFormOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetDemo() {
    window.localStorage.removeItem(DEMO_STATE_KEY);
    setDemoState(initialDemoState);
    setView('setup');
    setAssessorFormOpen(false);
    setPreviewRole('orchestrator');
    setToast('Conference demo reset to its starting state.');
  }

  function selectWorkspace(workspace: string) {
    if (workspace === 'institution') navigate('home');
    if (workspace === 'bcom') navigate('bcom');
    if (workspace === 'ba') navigate('other-school');
  }

  const workspaceValue = view === 'setup' || view === 'home' || view === 'cross-school' ? 'institution' : view === 'other-school' ? 'ba' : 'bcom';
  const activeStep = navigation.findIndex((item) => item.id === view);
  const completedActions = Number(demoState.pilotConfigured) + Number(demoState.assessorAssigned) + Number(demoState.baGroupSyncEnabled);

  return (
    <div className={styles.product}>
      <header className={styles.productBar}>
        <button className={styles.lockup} type="button" onClick={() => navigate('home')} aria-label="AFDA Continuum institution home">
          <Image src="/brand/afda-continuum-horizontal.svg" alt="AFDA Continuum" width={210} height={63} priority/>
        </button>
        <span className={styles.productBarTitle}>Conference prototype</span>
        <div className={styles.productBarActions}>
          <a href="/presentation/deck"><MonitorPlay size={17}/> Conference deck</a>
          <span className={styles.demoIndicator}>Fictional data</span>
          <div className={styles.orchestratorIdentity}><span className={styles.avatar}>DO</span><span><strong>Demo Orchestrator</strong><small>Super administrator</small></span></div>
        </div>
      </header>

      <div className={styles.appFrame}>
        <aside className={styles.sidebar}>
          <div className={styles.journeyHeading}>
            <span>Five-minute walkthrough</span>
            <strong>{completedActions} of 3 actions complete</strong>
            <div aria-hidden="true"><span style={{ width: `${completedActions * (100 / 3)}%` }}/></div>
          </div>
          <nav className={styles.navigation} aria-label="Conference demo journey">
            {navigation.map(({ id, label, detail, duration, icon: Icon }, index) => (
              <button key={id} type="button" className={view === id ? styles.navActive : undefined} onClick={() => navigate(id)} aria-current={view === id ? 'step' : undefined} aria-label={`${label}: ${detail}`}>
                <span className={styles.stepState}>{index < activeStep ? <Check aria-hidden="true" size={14}/> : <Icon aria-hidden="true" size={16}/>}</span>
                <span><strong>{label}</strong><small>{detail}</small></span>
                <time>{duration}</time>
              </button>
            ))}
          </nav>
          <div className={styles.sidebarFooter}>
            <span>Demo controls</span>
            <button type="button" className={styles.resetButton} onClick={resetDemo}><RefreshCcw size={14}/> Reset walkthrough</button>
          </div>
        </aside>

        <main className={styles.workspace}>
          <header className={styles.topbar}>
          <div className={styles.topbarContext}>
            <label htmlFor="workspace-select">School workspace</label>
            <div className={styles.selectWrap}><select id="workspace-select" value={workspaceValue} onChange={(event) => selectWorkspace(event.target.value)}><option value="institution">All workspaces</option><option value="bcom">BCom · configured pilot</option><option value="ba">BA · services only</option></select><ChevronDown aria-hidden="true" size={14}/></div>
            <span className={styles.period}><CalendarDays size={15}/>{demoState.pilotConfig.academicPeriod}</span>
          </div>
          <div className={styles.topbarActions}>
            <label htmlFor="preview-select">Preview experience as</label>
            <div className={styles.selectWrap}><select id="preview-select" value={previewRole} onChange={(event) => { const role = event.target.value as PreviewRole; setPreviewRole(role); if (role !== 'orchestrator') setView('assessment'); }}><option value="orchestrator">Orchestrator (current)</option><option value="lecturer">Lecturer</option><option value="assessor">Ad hoc assessor</option><option value="student">Student</option></select><ChevronDown aria-hidden="true" size={14}/></div>
          </div>
          </header>

          {previewRole !== 'orchestrator' ? (
            <PreviewExperience role={previewRole} pilotConfig={demoState.pilotConfig} assessorAssigned={demoState.assessorAssigned} onExit={() => setPreviewRole('orchestrator')}/>
          ) : (
            <div className={styles.content}>
              {view === 'setup' ? <PilotSetup config={demoState.pilotConfig} onApply={(pilotConfig) => { updateDemoState({ ...demoState, pilotConfigured: true, pilotConfig }, `${pilotConfig.workspace} pilot inputs applied in local demo state.`); navigate('home'); }}/>: null}
              {view === 'home' ? <InstitutionHome config={demoState.pilotConfig} onNavigate={navigate}/> : null}
              {view === 'bcom' ? <BcomWorkspace config={demoState.pilotConfig} onNavigate={navigate}/> : null}
              {view === 'assessment' ? <AssessmentWorkspace pilotConfig={demoState.pilotConfig} demoState={demoState} formOpen={assessorFormOpen} onBack={() => navigate('bcom')} onOpenForm={() => setAssessorFormOpen(true)} onCloseForm={() => setAssessorFormOpen(false)} onAssign={() => { updateDemoState({ ...demoState, assessorAssigned: true }, 'Jordan Maseko assigned to this assessment until 24 August.'); setAssessorFormOpen(false); }} onPreview={(role) => setPreviewRole(role)}/> : null}
              {view === 'other-school' ? <OtherSchoolWorkspace enabled={demoState.baGroupSyncEnabled} onEnable={() => updateDemoState({ ...demoState, baGroupSyncEnabled: true }, 'Group Sync enabled for the BA workspace in local demo state.')}/> : null}
              {view === 'cross-school' ? <CrossSchoolExploration onNavigate={navigate}/> : null}
            </div>
          )}
        </main>
      </div>
      {toast ? <div className={styles.toast} role="status"><Check size={16}/><span>{toast}</span></div> : null}
    </div>
  );
}

function PageHeading({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return <header className={styles.pageHeading}><div><h1>{title}</h1><p>{description}</p></div>{actions ? <div className={styles.headingActions}>{actions}</div> : null}</header>;
}

function PilotSetup({ config, onApply }: { config: PilotConfig; onApply: (config: PilotConfig) => void }) {
  const [draft, setDraft] = useState<PilotConfig>(config);
  const enabledServices = [draft.services.groups ? 'Group Sync' : '', draft.services.schedule ? 'Schedule' : '', draft.services.spaces ? 'Spaces & Resources' : ''].filter(Boolean);

  return <>
    <PageHeading title="Configure the conference pilot" description="Start with the inputs the orchestrator is responsible for. Continuum then exposes the resulting workspace and connected-service context."/>
    <section className={styles.setupWorkspace}>
      <form onSubmit={(event) => { event.preventDefault(); onApply(draft); }}>
        <div className={styles.setupHeading}><span className={styles.setupIcon}><SlidersHorizontal size={20}/></span><div><h2>Pilot configuration</h2><p>Fictional values stored only in this browser.</p></div></div>
        <div className={styles.setupFields}>
          <label><span>Academic period</span><select value={draft.academicPeriod} onChange={(event) => setDraft({ ...draft, academicPeriod: event.target.value })}><option>Term 3 · 2026</option><option>Term 1 · 2027</option></select></label>
          <label><span>Configured school workspace</span><select value={draft.workspace} onChange={(event) => setDraft({ ...draft, workspace: event.target.value })}><option>BCom</option></select></label>
          <label><span>Workspace purpose</span><input value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })}/></label>
          <label><span>Team formation rule</span><input value={draft.teamRule} onChange={(event) => setDraft({ ...draft, teamRule: event.target.value })}/></label>
        </div>
        <fieldset className={styles.serviceChoices}>
          <legend>Services to expose in the workspace</legend>
          <label><input type="checkbox" checked={draft.services.groups} onChange={(event) => setDraft({ ...draft, services: { ...draft.services, groups: event.target.checked } })}/><span><strong>Group Sync</strong><small>Existing team and participant records</small></span></label>
          <label><input type="checkbox" checked={draft.services.schedule} onChange={(event) => setDraft({ ...draft, services: { ...draft.services, schedule: event.target.checked } })}/><span><strong>Schedule</strong><small>Existing session and booking workflows</small></span></label>
          <label><input type="checkbox" checked={draft.services.spaces} onChange={(event) => setDraft({ ...draft, services: { ...draft.services, spaces: event.target.checked } })}/><span><strong>Spaces &amp; Resources</strong><small>Controlled testing reference only</small></span></label>
        </fieldset>
        <div className={styles.setupActions}><span><ShieldCheck size={17}/> No migration or institutional connection</span><button type="submit" className={styles.primaryButton}>Apply demo inputs <ArrowRight size={15}/></button></div>
      </form>
      <aside className={styles.outputPreview}>
        <span>Expected output</span>
        <h2>A {draft.workspace} workspace with traceable sources.</h2>
        <div><Check size={16}/><span><strong>Workspace</strong><small>{draft.workspace} becomes the only configured pilot for {draft.academicPeriod}.</small></span></div>
        <div><Check size={16}/><span><strong>Purpose and team rule</strong><small>{draft.purpose}. {draft.teamRule}.</small></span></div>
        <div><Check size={16}/><span><strong>Operational context</strong><small>{enabledServices.length ? enabledServices.join(', ') : 'No shared services'} will be exposed; their records remain source-owned.</small></span></div>
        <div><Check size={16}/><span><strong>Academic boundary</strong><small>No programme hierarchy, marks or CARS handoff is created.</small></span></div>
      </aside>
    </section>
    <SourceTrace items={[
      { icon: <ClipboardList size={18}/>, title: 'Orchestrator input', copy: 'Period, pilot school, workspace purpose and enabled services.' },
      { icon: <Database size={18}/>, title: 'Existing service records', copy: 'Teams from Group Sync and sessions from Schedule remain source-owned.' },
      { icon: <BookOpen size={18}/>, title: 'School-owned rules', copy: 'BCom disciplines, assessment criteria and grading rules remain academic inputs.' },
    ]}/>
  </>;
}

function SourceTrace({ items }: { items: Array<{ icon: React.ReactNode; title: string; copy: string }> }) {
  return <section className={styles.sourceTrace} aria-label="Input sources">
    {items.map((item) => <article key={item.title}><span>{item.icon}</span><div><strong>{item.title}</strong><small>{item.copy}</small></div></article>)}
  </section>;
}

function InstitutionHome({ config, onNavigate }: { config: PilotConfig; onNavigate: (view: PresentationView) => void }) {
  const establishedServices = [config.services.groups ? 'Group Sync' : '', config.services.schedule ? 'Schedule' : ''].filter(Boolean);
  return <>
    <PageHeading title="Institution overview" description="Coordinate school workspaces and shared services for the current academic period." actions={<button className={styles.secondaryButton} type="button" onClick={() => onNavigate('cross-school')}><Users size={15}/> View shared project</button>}/>
    <section className={styles.institutionLead}>
      <div>
        <h2>{config.academicPeriod}</h2>
        <p>{academicPeriod.dates}. {config.workspace} is configured for {config.purpose.toLowerCase()}; other schools can use established services without a fabricated academic model.</p>
      </div>
      <dl>
        <div><dt>Configured pilot</dt><dd>{config.workspace}</dd></div>
        <div><dt>Existing services</dt><dd>{establishedServices.length ? establishedServices.join(' · ') : 'None exposed'}</dd></div>
        <div><dt>Controlled testing</dt><dd>{config.services.spaces ? 'Spaces & Resources' : 'Not exposed'}</dd></div>
      </dl>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h2>School workspaces</h2><p>Enter a school or manage access to established services.</p></div></div>
      <div className={styles.workspaceTable}>
        <button type="button" className={styles.workspaceRow} onClick={() => onNavigate('bcom')}>
          <span className={styles.workspaceMonogram}>BC</span><span className={styles.workspaceCopy}><strong>{config.workspace}</strong><small>Configured pilot · {config.purpose.toLowerCase()}</small></span><span className={styles.serviceTags}>{config.services.groups ? <em>Group Sync</em> : null}{config.services.schedule ? <em>Schedule</em> : null}{config.services.spaces ? <em data-test="true">Spaces testing</em> : null}</span><span className={styles.stateReady}>Configured</span><ArrowRight size={17}/>
        </button>
        <button type="button" className={styles.workspaceRow} onClick={() => onNavigate('other-school')}>
          <span className={styles.workspaceMonogram}>BA</span><span className={styles.workspaceCopy}><strong>BA</strong><small>No academic model configured · shared-service access only</small></span><span className={styles.serviceTags}><em>Schedule</em><em data-muted="true">Group Sync available</em></span><span className={styles.stateAvailable}>Services available</span><ArrowRight size={17}/>
        </button>
        <div className={styles.workspaceRow}>
          <span className={styles.workspaceMonogram}>MP</span><span className={styles.workspaceCopy}><strong>MP</strong><small>Workspace reserved for school-led configuration</small></span><span className={styles.serviceTags}><em data-muted="true">No services enabled</em></span><span className={styles.stateQuiet}>Not configured</span><span aria-hidden="true"/>
        </div>
      </div>
    </section>

    <div className={styles.homeGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHeading}><div><h2>Needs attention</h2><p>Actions waiting for the orchestrator</p></div></div>
        <button className={styles.actionRow} type="button" onClick={() => onNavigate('assessment')}><span className={styles.actionIcon}><ShieldCheck size={16}/></span><span><strong>Assign the ad hoc assessor</strong><small>Business Concept Presentation · BCom</small></span><span className={styles.statusWarning}>Required</span><ArrowRight size={16}/></button>
        <button className={styles.actionRow} type="button" onClick={() => onNavigate('other-school')}><span className={styles.actionIcon}><Link2 size={16}/></span><span><strong>Review BA service access</strong><small>Group Sync is available but not enabled</small></span><span className={styles.statusNeutral}>Review</span><ArrowRight size={16}/></button>
        <button className={styles.actionRow} type="button" onClick={() => onNavigate('cross-school')}><span className={styles.actionIcon}><Users size={16}/></span><span><strong>Review cross-school participation</strong><small>Community Enterprise Lab · concept exploration</small></span><span className={styles.statusNeutral}>Concept</span><ArrowRight size={16}/></button>
      </section>
      <ServiceLaunchPanel config={config}/>
    </div>
  </>;
}

function ServiceLaunchPanel({ config }: { config: PilotConfig }) {
  const connected = [
    { name: 'Group Sync', detail: config.services.groups ? 'Exposed to BCom · teams and participant rosters' : 'Existing service · not exposed to BCom', href: config.services.groups ? serviceLinks.groups : '' },
    { name: 'Staff Schedule', detail: config.services.schedule ? 'Exposed to BCom · sessions, slots and attendance' : 'Existing service · not exposed to BCom', href: config.services.schedule ? serviceLinks.schedule : '' },
    { name: 'Student Booking', detail: config.services.schedule ? 'Published booking touchpoint through Schedule' : 'Existing touchpoint · Schedule not exposed to BCom', href: config.services.schedule ? serviceLinks.students : '' },
    { name: 'Spaces & Resources', detail: config.services.spaces ? 'Exposed for controlled testing · validation required' : 'Emerging service · not exposed to BCom', href: config.services.spaces ? serviceLinks.spaces : '' },
  ];
  return <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Connected applications</h2><p>Continuum preserves the service that owns each workflow.</p></div></div>{connected.map((service) => <div className={styles.serviceLaunch} key={service.name}><span><strong>{service.name}</strong><small>{service.detail}</small></span>{service.href ? <a href={service.href} target="_blank" rel="noreferrer">Open <ExternalLink size={13}/></a> : <span className={styles.notConfigured}>Launch not configured</span>}</div>)}</section>;
}

function BcomWorkspace({ config, onNavigate }: { config: PilotConfig; onNavigate: (view: PresentationView) => void }) {
  function visibleOperationalContext(serviceContext: string) {
    if (!serviceContext.includes('Schedule')) return serviceContext;
    if (!config.services.schedule) return 'Not exposed by pilot input';
    if (!config.services.spaces) return 'Schedule · no space exposed';
    return serviceContext;
  }

  return <>
    <button className={styles.backButton} type="button" onClick={() => onNavigate('home')}><ArrowLeft size={15}/> Institution overview</button>
    <PageHeading title="BCom workspace" description="The configured pilot workspace for multidisciplinary teams, assessment activity and connected services." actions={<button className={styles.primaryButton} type="button" onClick={() => onNavigate('assessment')}>Open assessment <ArrowRight size={15}/></button>}/>
    <SourceTrace items={[
      { icon: <ClipboardList size={18}/>, title: 'School input', copy: `Four BCom disciplines. Rule: ${config.teamRule}.` },
      { icon: <Database size={18}/>, title: 'Group Sync output', copy: config.services.groups ? 'Neighbourhood Futures and its four current members.' : 'Not exposed by the saved pilot configuration.' },
      { icon: <CalendarDays size={18}/>, title: 'Schedule output', copy: config.services.schedule ? 'Term activities and timed assessment sessions.' : 'Not exposed by the saved pilot configuration.' },
    ]}/>
    <section className={styles.bcomLead}>
      <div><h2>{config.teamRule}.</h2><p>{config.purpose}. Teams are formed independently from assessments and can remain active across the term.</p></div>
      <div className={styles.disciplineGrid}>{disciplines.map((discipline, index) => <div key={discipline}><span>{index + 1}</span><strong>{discipline}</strong></div>)}</div>
    </section>

    <div className={styles.bcomGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHeading}><div><h2>{team.name}</h2><p>{team.formed}</p></div><span className={styles.stateReady}>Active team</span></div>
        {config.services.groups ? team.members.map((member) => <div className={styles.personRow} key={member.name}><span className={styles.avatarLight}>{member.initials}</span><span><strong>{member.name}</strong><small>{member.discipline}</small></span><span className={styles.statusNeutral}>BCom</span></div>) : <div className={styles.emptyRow}><Users size={18}/><span><strong>Team records are not exposed</strong><small>Enable Group Sync in Pilot inputs to make source-owned participant records visible.</small></span></div>}
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHeading}><div><h2>Enabled services</h2><p>Available to the workspace when an activity needs them.</p></div></div>
        <div className={styles.serviceStatus}><span><Users size={16}/><strong>Group Sync</strong></span><span className={config.services.groups ? styles.stateReady : styles.stateQuiet}>{config.services.groups ? 'Enabled' : 'Not exposed'}</span></div>
        <div className={styles.serviceStatus}><span><CalendarDays size={16}/><strong>Schedule</strong></span><span className={config.services.schedule ? styles.stateReady : styles.stateQuiet}>{config.services.schedule ? 'Enabled' : 'Not exposed'}</span></div>
        <div className={styles.serviceStatus}><span><MapPin size={16}/><strong>Spaces &amp; Resources</strong></span><span className={config.services.spaces ? styles.statusWarning : styles.stateQuiet}>{config.services.spaces ? 'Controlled test' : 'Not exposed'}</span></div>
      </section>
    </div>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h2>Assessment activity across the term</h2><p>Scheduling and venue context appear only where required.</p></div></div>
      <div className={styles.assessmentTable}>
        <div className={styles.tableHeader}><span>Date</span><span>Assessment</span><span>Participation</span><span>Operational context</span><span>Status</span><span/></div>
        {assessments.map((item) => <button type="button" className={styles.tableRow} key={item.id} onClick={() => item.id === 'business-presentation' && onNavigate('assessment')} disabled={item.id !== 'business-presentation'}><time>{item.date}</time><span><strong>{item.title}</strong><small>{item.module}</small></span><span>{item.participation}</span><span>{visibleOperationalContext(item.services)}</span><span className={item.state === 'Reviewed' ? styles.stateReady : item.state === 'Marking open' ? styles.statusWarning : styles.statusNeutral}>{item.state}</span><span>{item.id === 'business-presentation' ? <ArrowRight size={16}/> : null}</span></button>)}
      </div>
    </section>
  </>;
}

function AssessmentWorkspace({ pilotConfig, demoState, formOpen, onBack, onOpenForm, onCloseForm, onAssign, onPreview }: { pilotConfig: PilotConfig; demoState: DemoState; formOpen: boolean; onBack: () => void; onOpenForm: () => void; onCloseForm: () => void; onAssign: () => void; onPreview: (role: PreviewRole) => void }) {
  return <>
    <button className={styles.backButton} type="button" onClick={onBack}><ArrowLeft size={15}/> BCom workspace</button>
    <PageHeading title={assessment.title} description={`${assessment.module} · ${assessment.date} · ${assessment.participation}`} actions={<button className={styles.secondaryButton} type="button" onClick={() => onPreview('lecturer')}><Eye size={15}/> Preview lecturer</button>}/>
    <SourceTrace items={[
      { icon: <BookOpen size={18}/>, title: 'School assessment input', copy: 'Existing-team participation, rubric criteria and reviewer responsibilities.' },
      { icon: <Users size={18}/>, title: 'Group Sync reference', copy: pilotConfig.services.groups ? 'Neighbourhood Futures is linked; Continuum does not rebuild the team.' : 'Not exposed by the saved pilot configuration.' },
      { icon: <CalendarDays size={18}/>, title: 'Operational input', copy: pilotConfig.services.schedule ? `${assessment.date}, ${assessment.time}${pilotConfig.services.spaces ? ` and the ${assessment.venue} reference` : '; no space service exposed'}.` : 'No Schedule context exposed by the saved pilot configuration.' },
    ]}/>
    <section className={styles.assessmentSummary}>
      <dl><div><dt>Participation</dt><dd>{assessment.participation}</dd></div><div><dt>Scheduled session</dt><dd>{pilotConfig.services.schedule ? `${assessment.date} · ${assessment.time}` : 'Not exposed by pilot input'}</dd></div><div><dt>Physical space</dt><dd>{pilotConfig.services.spaces ? <>{assessment.venue}<small>{assessment.venueNote}</small></> : 'Not exposed by pilot input'}</dd></div><div><dt>Scope</dt><dd>{assessment.scope}</dd></div></dl>
      <div className={styles.progressSummary}><span>Marking progress</span><strong>{demoState.assessorAssigned ? '3 of 4 sections active' : '2 of 4 sections active'}</strong><div aria-label="Marking progress" role="progressbar" aria-valuenow={demoState.assessorAssigned ? 75 : 50} aria-valuemin={0} aria-valuemax={100}><span style={{ width: demoState.assessorAssigned ? '75%' : '50%' }}/></div><small>No official grade is calculated or sent to CARS.</small></div>
    </section>

    <div className={styles.assessmentGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHeading}><div><h2>Assigned markers</h2><p>Access is limited to this assessment and academic period.</p></div>{!demoState.assessorAssigned ? <button type="button" className={styles.primaryButton} onClick={onOpenForm}>Assign ad hoc assessor</button> : null}</div>
        {assessment.markers.map((marker) => <div className={styles.markerRow} key={marker.name}><span className={styles.avatarLight}>{marker.name.split(' ').map((part) => part[0]).join('')}</span><span><strong>{marker.name}</strong><small>{marker.role} · {marker.scope}</small></span><span className={marker.state === 'Submitted' ? styles.stateReady : styles.statusWarning}>{marker.state}</span></div>)}
        {demoState.assessorAssigned ? <div className={styles.markerRow}><span className={styles.avatarDark}>JM</span><span><strong>Jordan Maseko</strong><small>Ad hoc internal assessor · Market readiness only · expires 24 Aug</small></span><span className={styles.statusWarning}>Outstanding</span></div> : <div className={styles.emptyRow}><ShieldCheck size={18}/><span><strong>Market readiness has no assessor</strong><small>Assign a fictional internal assessor to complete the demonstration.</small></span></div>}
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHeading}><div><h2>Team</h2><p>{team.name} · four disciplines represented</p></div></div>
        {pilotConfig.services.groups ? team.members.map((member) => <div className={styles.personRow} key={member.name}><span className={styles.avatarLight}>{member.initials}</span><span><strong>{member.name}</strong><small>{member.discipline}</small></span></div>) : <div className={styles.emptyRow}><Users size={18}/><span><strong>Group Sync records are not exposed</strong><small>The school assessment remains visible, but participant details stay with the source service.</small></span></div>}
      </section>
    </div>

    {formOpen ? <AssessorForm onClose={onCloseForm} onAssign={onAssign}/> : null}

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h2>Rubric and feedback progress</h2><p>The school supplies the criteria and grading rules; Continuum coordinates allocation and review.</p></div></div>
      <div className={styles.rubricTable}>
        <div className={styles.tableHeader}><span>Criterion</span><span>Applies to</span><span>Weight</span><span>Progress</span></div>
        {assessment.rubric.map((criterion) => <div className={styles.rubricRow} key={criterion.title}><strong>{criterion.title}</strong><span>{criterion.appliesTo}</span><span>{criterion.weight}</span><span className={criterion.progress === 'Reviewed' ? styles.stateReady : criterion.progress === 'Outstanding' ? styles.statusWarning : styles.statusNeutral}>{demoState.assessorAssigned && criterion.title === 'Market readiness' ? 'Assigned' : criterion.progress}</span></div>)}
      </div>
    </section>

    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h2>Assessment audit</h2><p>Fictional local events for the conference demonstration.</p></div></div>
      <ol className={styles.auditList}>
        {demoState.assessorAssigned ? <li><time>Today · 11:18</time><span><strong>Demo Orchestrator assigned Jordan Maseko</strong><small>Market readiness · access 18–24 August · this assessment only</small></span><span className={styles.stateReady}>Completed</span></li> : null}
        <li><time>Today · 10:31</time><span><strong>Maya Naidoo opened lecturer review</strong><small>Shared proposition · reviewer note added</small></span><span className={styles.statusNeutral}>Recorded</span></li>
        <li><time>Yesterday · 16:42</time><span><strong>Naledi Jacobs submitted Team synthesis</strong><small>Waiting for lecturer review</small></span><span className={styles.stateReady}>Submitted</span></li>
      </ol>
    </section>
  </>;
}

function AssessorForm({ onClose, onAssign }: { onClose: () => void; onAssign: () => void }) {
  return <section className={styles.inlineForm} aria-labelledby="assign-assessor-title">
    <div className={styles.inlineFormHeading}><div><h2 id="assign-assessor-title">Assign ad hoc assessor</h2><p>This fictional grant is stored only in this browser.</p></div><button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close assessor assignment"><X size={17}/></button></div>
    <div className={styles.formGrid}>
      <label><span>Assessor</span><select defaultValue="jordan"><option value="jordan">Jordan Maseko · internal ad hoc</option></select></label>
      <label><span>Rubric scope</span><select defaultValue="market"><option value="market">Market readiness only</option></select></label>
      <label><span>Access starts</span><input type="date" defaultValue="2026-08-18"/></label>
      <label><span>Access expires</span><input type="date" defaultValue="2026-08-24"/></label>
    </div>
    <div className={styles.scopeNotice}><ShieldCheck size={18}/><span><strong>Scoped access</strong><small>Business Concept Presentation · evidence pack and assigned rubric criterion only. No CARS access.</small></span></div>
    <div className={styles.formActions}><button type="button" className={styles.secondaryButton} onClick={onClose}>Cancel</button><button type="button" className={styles.primaryButton} onClick={onAssign}>Assign assessor <Check size={15}/></button></div>
  </section>;
}

function PreviewExperience({ role, pilotConfig, assessorAssigned, onExit }: { role: Exclude<PreviewRole, 'orchestrator'>; pilotConfig: PilotConfig; assessorAssigned: boolean; onExit: () => void }) {
  const copy = previewCopy[role];
  const title = role === 'lecturer' ? 'Previewing lecturer experience' : role === 'assessor' ? 'Previewing ad hoc assessor experience' : 'Previewing student experience';
  return <div className={styles.previewSurface}>
    <div className={styles.previewBanner}><Eye size={17}/><span><strong>{title}</strong><small>You remain signed in as Demo Orchestrator. This preview does not change identity or permissions.</small></span><button type="button" onClick={onExit}>Exit preview</button></div>
    <div className={styles.previewFrame}>
      <aside><span className={styles.previewProduct}>AFDA Continuum</span><nav aria-label="Preview sections"><span data-active="true">Assessment</span><span>Evidence</span><span>Rubric</span><span>Feedback</span></nav><div><strong>{role === 'lecturer' ? 'Maya Naidoo' : role === 'assessor' ? 'Jordan Maseko' : 'Amara Ndlovu'}</strong><small>{role === 'lecturer' ? 'Lecturer' : role === 'assessor' ? 'Ad hoc assessor' : 'Student'}</small></div></aside>
      <main>
        <span className={styles.previewWorkspace}>BCom · {pilotConfig.academicPeriod}</span>
        <h1>{copy.title}</h1><p>{copy.summary}</p>
        <section className={styles.previewTask}><span>Next responsibility</span><strong>{role === 'assessor' && !assessorAssigned ? 'Assignment required before this workspace opens' : copy.task}</strong>{role === 'assessor' && !assessorAssigned ? <button type="button" onClick={onExit}>Return to orchestrator</button> : <a href="#preview-scope">Open assigned work</a>}</section>
        <div className={styles.previewColumns} id="preview-scope">
          <section><h2>{assessment.title}</h2><dl><div><dt>Session</dt><dd>{pilotConfig.services.schedule ? `${assessment.date} · ${assessment.time}` : 'Not exposed by pilot input'}</dd></div><div><dt>Participation</dt><dd>{assessment.participation}</dd></div><div><dt>Space</dt><dd>{pilotConfig.services.spaces ? assessment.venue : 'Not exposed by pilot input'}</dd></div></dl></section>
          <section><h2>Visible scope</h2><p>{copy.boundary}</p><span className={styles.scopePill}>{role === 'assessor' ? 'Expires 24 August' : role === 'student' ? 'Student view' : 'BCom lecturer'}</span></section>
        </div>
      </main>
    </div>
  </div>;
}

function OtherSchoolWorkspace({ enabled, onEnable }: { enabled: boolean; onEnable: () => void }) {
  return <>
    <PageHeading title="BA workspace" description="Enable established services without inventing the school's programme, module or assessment model."/>
    <div className={styles.schoolBoundary}><Building2 size={22}/><span><strong>School-owned academic configuration is not present.</strong><small>BA decides its own terminology, curriculum, disciplines, rubrics and grading rules. Continuum is only managing service access here.</small></span></div>
    <section className={styles.section}>
      <div className={styles.sectionHeading}><div><h2>Shared-service access</h2><p>Changes persist only in local conference-demo state.</p></div></div>
      <div className={styles.serviceAccessList}>
        <article><span className={styles.serviceAccessIcon}><CalendarDays size={18}/></span><span><strong>Schedule</strong><small>Session planning and published booking windows</small></span><span className={styles.stateReady}>Enabled</span><span className={styles.managedLabel}>Configured</span></article>
        <article><span className={styles.serviceAccessIcon}><Users size={18}/></span><span><strong>Group Sync</strong><small>Team formation and participant rosters</small></span><span className={enabled ? styles.stateReady : styles.statusNeutral}>{enabled ? 'Enabled' : 'Available'}</span>{enabled ? <span className={styles.managedLabel}>Configured</span> : <button type="button" className={styles.primaryButton} onClick={onEnable}>Enable Group Sync</button>}</article>
        <article data-disabled="true"><span className={styles.serviceAccessIcon}><MapPin size={18}/></span><span><strong>Spaces &amp; Resources</strong><small>Emerging workflow · not cleared for this workspace</small></span><span className={styles.statusWarning}>Controlled testing</span><button type="button" className={styles.secondaryButton} disabled>Unavailable</button></article>
      </div>
    </section>
    {enabled ? <section className={styles.successPanel}><Check size={20}/><div><strong>Group Sync is available to BA.</strong><p>The school can now launch the established service. No curriculum, assessment or team rules were added.</p></div><span>Local demo state</span></section> : null}
  </>;
}

function CrossSchoolExploration({ onNavigate }: { onNavigate: (view: PresentationView) => void }) {
  const participants = [
    { name: 'Kabelo Mokoena', school: 'BCom', discipline: 'Marketing and Sales', approval: 'Approved by BCom' },
    { name: 'Leah Daniels', school: 'BCom', discipline: 'U(I)X Operations and Design', approval: 'Approved by BCom' },
    { name: 'Zinhle Dube', school: 'BA', discipline: 'Discipline supplied by home school (demo)', approval: 'BA approval requested' },
  ];
  return <>
    <PageHeading title="Community Enterprise Lab" description="A restrained exploration of cross-school participation coordinated by Continuum." actions={<button className={styles.secondaryButton} type="button" onClick={() => onNavigate('home')}><ArrowLeft size={15}/> Institution</button>}/>
    <SourceTrace items={[
      { icon: <Users size={18}/>, title: 'Membership input', copy: 'Named participants are added to this shared project only.' },
      { icon: <Database size={18}/>, title: 'Retained home context', copy: 'School and discipline remain attached from the participant source.' },
      { icon: <ShieldCheck size={18}/>, title: 'Approval input', copy: 'Each home school controls participation and any connection to curriculum credit.' },
    ]}/>
    <section className={styles.crossSchoolLead}>
      <div><h2>Shared project, retained school context.</h2><p>Continuum facilitates membership, access, scheduling and shared resources. Each school decides whether and how participation connects to its curriculum or assessment.</p></div>
      <dl><div><dt>Project period</dt><dd>03–14 September 2026</dd></div><div><dt>Participating workspaces</dt><dd>BCom · BA</dd></div><div><dt>Access boundary</dt><dd>This shared project only</dd></div></dl>
    </section>
    <div className={styles.crossSchoolGrid}>
      <section className={styles.panel}>
        <div className={styles.panelHeading}><div><h2>Participants and approvals</h2><p>Home school and discipline remain attached to each person.</p></div></div>
        {participants.map((person) => <div className={styles.crossParticipant} key={person.name}><span className={styles.avatarLight}>{person.name.split(' ').map((part) => part[0]).join('')}</span><span><strong>{person.name}</strong><small>{person.school} · {person.discipline}</small></span><span className={person.approval.includes('requested') ? styles.statusWarning : styles.stateReady}>{person.approval}</span></div>)}
      </section>
      <section className={styles.panel}>
        <div className={styles.panelHeading}><div><h2>Facilitated context</h2><p>Operational references, not school academic rules.</p></div></div>
        <div className={styles.contextRow}><CalendarDays size={17}/><span><strong>Shared working session</strong><small>09 September · 13:00–15:00 · Schedule reference</small></span></div>
        <div className={styles.contextRow}><MapPin size={17}/><span><strong>Innovation Hub</strong><small>Requested resource · Spaces workflow still requires validation</small></span></div>
        <div className={styles.contextRow}><ShieldCheck size={17}/><span><strong>Project-scoped access</strong><small>Ends 14 September · no access to either school&apos;s other records</small></span></div>
      </section>
    </div>
    <section className={styles.boundaryStatement}><CircleAlert size={19}/><span><strong>Continuum does not decide curriculum credit.</strong><small>BCom and BA independently decide whether this shared project connects to an assessment, module or no academic credit at all.</small></span></section>
  </>;
}
