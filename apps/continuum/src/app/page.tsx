'use client';

import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Database,
  ExternalLink,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  LogIn,
  LogOut,
  MapPin,
  MonitorPlay,
  Settings2,
  RefreshCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  continuumApiBase,
  createContinuumAccessGrant,
  createContinuumGroupSession,
  createContinuumWorkspace,
  loadContinuumOverview,
  revokeContinuumAccessGrant,
  updateContinuumWorkspaceService,
  type ContinuumOverview,
  type ContinuumService,
  type ContinuumWorkspace,
  type ContinuumWorkspaceService,
  type GroupSyncRecord,
  type ScheduleRecord,
  type SourceState,
  type SpaceRequestRecord,
} from '@/lib/platform-api';
import { continuumAuthConfigured, continuumSupabase } from '@/lib/supabase';
import styles from './operational.module.css';

type OperationalView = 'overview' | 'setup' | 'groups' | 'schedule' | 'spaces';

const serviceUrls = {
  groups: process.env.NEXT_PUBLIC_GROUPS_URL || '',
  schedule: process.env.NEXT_PUBLIC_SCHEDULE_STAFF_URL || '',
  spaces: process.env.NEXT_PUBLIC_WORKSUITE_URL || '',
};

const navigation: Array<{ id: OperationalView; label: string; detail: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Live overview', detail: 'Current source-owned records', icon: LayoutDashboard },
  { id: 'setup', label: 'Workspace setup', detail: 'Inputs, services and lineage', icon: Settings2 },
  { id: 'groups', label: 'Group Sync', detail: 'Sessions, teams and participants', icon: Users },
  { id: 'schedule', label: 'Schedule', detail: 'Batches, slots and bookings', icon: CalendarDays },
  { id: 'spaces', label: 'Spaces & Resources', detail: 'Your operational requests', icon: MapPin },
];

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return 'Not supplied';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-ZA', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(date);
}

function relatedName(value: { name: string } | Array<{ name: string }> | null) {
  return Array.isArray(value) ? value[0]?.name || 'No venue' : value?.name || 'No venue';
}

function initials(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const letters = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.trim();
  return (letters || email?.slice(0, 2) || 'AF').toUpperCase();
}

export default function ContinuumOperationalPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [view, setView] = useState<OperationalView>('overview');
  const [overview, setOverview] = useState<ContinuumOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [actionError, setActionError] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [institutionName, setInstitutionName] = useState('AFDA');
  const [institutionShortName, setInstitutionShortName] = useState('AFDA');
  const [workspaceName, setWorkspaceName] = useState('BCom workspace');
  const [schoolCode, setSchoolCode] = useState('BCOM');
  const [academicPeriod, setAcademicPeriod] = useState('Term 3');
  const [academicYear, setAcademicYear] = useState('2026');
  const [periodStart, setPeriodStart] = useState('2026-07-20');
  const [periodEnd, setPeriodEnd] = useState('2026-09-25');
  const [programmeLabel, setProgrammeLabel] = useState('Bachelor of Commerce in Business Innovation');
  const [setupBusy, setSetupBusy] = useState('');
  const [setupNotice, setSetupNotice] = useState('');
  const [setupError, setSetupError] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantReason, setGrantReason] = useState('Conference pilot access');
  const [grantExpiresAt, setGrantExpiresAt] = useState('2026-10-31T17:00');

  const loadOverview = useCallback(async (activeSession: Session) => {
    setLoading(true);
    setLoadError('');
    try {
      setOverview(await loadContinuumOverview(activeSession.access_token));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Continuum could not load live source data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!continuumSupabase) {
      setAuthReady(true);
      return;
    }
    let mounted = true;
    void continuumSupabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
      if (data.session) void loadOverview(data.session);
    });
    const { data: listener } = continuumSupabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession) void loadOverview(nextSession);
      else setOverview(null);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadOverview]);

  useEffect(() => {
    if (!overview?.orchestration.workspaces.length) {
      setSelectedWorkspaceId('');
      return;
    }
    if (!selectedWorkspaceId || !overview.orchestration.workspaces.some((workspace) => workspace.id === selectedWorkspaceId)) {
      setSelectedWorkspaceId(overview.mapping.workspace_id || overview.orchestration.workspaces[0].id);
    }
  }, [overview, selectedWorkspaceId]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    if (!continuumSupabase) return;
    setAuthBusy(true);
    setAuthError('');
    const { error } = await continuumSupabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setAuthError(error.message);
    setAuthBusy(false);
  }

  async function signOut() {
    if (!continuumSupabase) return;
    await continuumSupabase.auth.signOut();
    setView('overview');
    setActionNotice('');
  }

  async function createSession(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !selectedWorkspaceId || sessionName.trim().length < 3) return;
    setCreating(true);
    setActionNotice('');
    setActionError(false);
    try {
      const created = await createContinuumGroupSession(session.access_token, selectedWorkspaceId, sessionName.trim());
      setOverview((current) => current ? { ...current, group_sync: [created, ...current.group_sync] } : current);
      setSessionName('');
      setActionNotice(`${created.name || 'Group Sync session'} created in the live Group Sync source with code ${created.code}.`);
      await loadOverview(session);
    } catch (error) {
      setActionError(true);
      setActionNotice(error instanceof Error ? error.message : 'The Group Sync session could not be created.');
    } finally {
      setCreating(false);
    }
  }

  async function createWorkspace(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    setSetupBusy('workspace');
    setSetupNotice('');
    setSetupError(false);
    try {
      const created = await createContinuumWorkspace(session.access_token, {
        institution_name: institutionName,
        institution_short_name: institutionShortName,
        timezone: 'Africa/Johannesburg',
        period_name: academicPeriod,
        academic_year: Number(academicYear),
        starts_on: periodStart,
        ends_on: periodEnd,
        name: workspaceName,
        school_code: schoolCode,
        programme_label: programmeLabel,
        description: 'School workspace configured through the Continuum orchestration console.',
      });
      setSelectedWorkspaceId(created.workspace.id);
      setSetupNotice(`${created.workspace.name} was created from the submitted institution, period and workspace inputs.`);
      await loadOverview(session);
    } catch (error) {
      setSetupError(true);
      setSetupNotice(error instanceof Error ? error.message : 'The workspace could not be created.');
    } finally {
      setSetupBusy('');
    }
  }

  async function setWorkspaceService(serviceId: string, enabled: boolean) {
    if (!session || !selectedWorkspaceId) return;
    setSetupBusy(serviceId);
    setSetupNotice('');
    setSetupError(false);
    try {
      await updateContinuumWorkspaceService(session.access_token, selectedWorkspaceId, { service_id: serviceId, enabled });
      const serviceName = overview?.orchestration.services.find((service) => service.id === serviceId)?.name || 'Service';
      setSetupNotice(`${serviceName} is now ${enabled ? 'enabled' : 'disabled'} for the selected workspace.`);
      await loadOverview(session);
    } catch (error) {
      setSetupError(true);
      setSetupNotice(error instanceof Error ? error.message : 'The service configuration could not be updated.');
    } finally {
      setSetupBusy('');
    }
  }

  async function grantWorkspaceAccess(event: React.FormEvent) {
    event.preventDefault();
    if (!session || !selectedWorkspaceId || !grantEmail.trim()) return;
    const groupService = overview?.orchestration.services.find((service) => service.service_type === 'groups');
    if (!groupService) return;
    setSetupBusy('grant');
    setSetupNotice('');
    setSetupError(false);
    try {
      const expiresAt = grantExpiresAt ? new Date(grantExpiresAt).toISOString() : null;
      const grant = await createContinuumAccessGrant(session.access_token, selectedWorkspaceId, {
        user_email: grantEmail.trim(),
        service_id: groupService.id,
        capabilities: ['group_sync_manage'],
        expires_at: expiresAt,
        reason: grantReason.trim(),
      });
      setSetupNotice(`Group Sync access granted to ${grant.user?.email || grantEmail.trim()}.`);
      setGrantEmail('');
      await loadOverview(session);
    } catch (error) {
      setSetupError(true);
      setSetupNotice(error instanceof Error ? error.message : 'Scoped access could not be granted.');
    } finally {
      setSetupBusy('');
    }
  }

  async function revokeWorkspaceAccess(grantId: string) {
    if (!session) return;
    setSetupBusy(grantId);
    setSetupNotice('');
    setSetupError(false);
    try {
      await revokeContinuumAccessGrant(session.access_token, grantId);
      setSetupNotice('Scoped access was revoked and retained in the audit history.');
      await loadOverview(session);
    } catch (error) {
      setSetupError(true);
      setSetupNotice(error instanceof Error ? error.message : 'Scoped access could not be revoked.');
    } finally {
      setSetupBusy('');
    }
  }

  if (!authReady) return <LoadingScreen/>;
  if (!continuumAuthConfigured) return <ConfigurationScreen/>;
  if (!session) return <SignInScreen email={email} password={password} busy={authBusy} error={authError} onEmail={setEmail} onPassword={setPassword} onSubmit={signIn}/>;

  const profile = overview?.profile;
  const sourceCount = overview ? Object.values(overview.sources).filter((source) => source.available).length : 0;
  const selectedWorkspace = overview?.orchestration.workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null;
  const groupService = overview?.orchestration.services.find((service) => service.service_type === 'groups');
  const canManageGroupSync = Boolean(
    overview?.orchestration.effective_access.is_admin
    || (groupService && overview?.orchestration.effective_access.grants.some((grant) =>
      grant.workspace_id === selectedWorkspaceId
      && (!grant.service_id || grant.service_id === groupService.id)
      && (grant.capabilities.includes('orchestrate_workflows') || grant.capabilities.includes('group_sync_manage'))
    ))
  );

  return (
    <div className={styles.product}>
      <header className={styles.productBar}>
        <button type="button" className={styles.lockup} onClick={() => setView('overview')} aria-label="AFDA Continuum live overview">
          <Image src="/brand/afda-continuum-horizontal.svg" alt="AFDA Continuum" width={210} height={63} priority/>
        </button>
        <span className={styles.productTitle}>Operational platform</span>
        <div className={styles.productActions}>
          <a href="/presentation"><MonitorPlay size={16}/> Conference prototype</a>
          <span className={styles.liveBadge}><span/> Live source data</span>
          <div className={styles.identity}>
            <span className={styles.avatar}>{initials(profile?.first_name, profile?.last_name, session.user.email)}</span>
            <span><strong>{profile?.first_name || session.user.email?.split('@')[0] || 'AFDA user'}</strong><small>{profile?.role_v2 || 'Authenticated'}</small></span>
          </div>
          <button type="button" className={styles.iconButton} onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={16}/></button>
        </div>
      </header>

      <div className={styles.appFrame}>
        <aside className={styles.sidebar}>
          <div className={styles.railHeading}><span>Continuum services</span><strong>{sourceCount} of 3 sources available</strong></div>
          <nav className={styles.navigation} aria-label="Operational platform">
            {navigation.map(({ id, label, detail, icon: Icon }) => (
              <button key={id} type="button" className={view === id ? styles.active : undefined} onClick={() => setView(id)} aria-current={view === id ? 'page' : undefined}>
                <span><Icon size={16}/></span><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight size={15}/>
              </button>
            ))}
          </nav>
          <div className={styles.railFooter}>
            <span><ShieldCheck size={15}/> Authenticated through Supabase</span>
            <small>Existing services retain ownership of their records and workflows.</small>
          </div>
        </aside>

        <main className={styles.workspace}>
          <header className={styles.contextBar}>
            <div><span>Scope</span><strong>{selectedWorkspace?.name || 'Institution-wide source records'}</strong></div>
            <div><span>BCom mapping</span><strong>{overview?.mapping.bcom.replaceAll('_', ' ') || 'Not configured'}</strong></div>
            <button type="button" onClick={() => session && loadOverview(session)} disabled={loading}><RefreshCcw className={loading ? styles.spinning : undefined} size={15}/>{loading ? 'Refreshing' : 'Refresh live data'}</button>
          </header>
          <div className={styles.content}>
            {loadError ? <ErrorNotice message={loadError}/> : null}
            {view === 'overview' ? <Overview overview={overview} loading={loading} onNavigate={setView}/> : null}
            {view === 'setup' ? <WorkspaceSetupView overview={overview} selectedWorkspaceId={selectedWorkspaceId} institutionName={institutionName} institutionShortName={institutionShortName} workspaceName={workspaceName} schoolCode={schoolCode} academicPeriod={academicPeriod} academicYear={academicYear} periodStart={periodStart} periodEnd={periodEnd} programmeLabel={programmeLabel} grantEmail={grantEmail} grantReason={grantReason} grantExpiresAt={grantExpiresAt} busy={setupBusy} notice={setupNotice} noticeError={setupError} onSelectWorkspace={setSelectedWorkspaceId} onInstitutionName={setInstitutionName} onInstitutionShortName={setInstitutionShortName} onWorkspaceName={setWorkspaceName} onSchoolCode={setSchoolCode} onAcademicPeriod={setAcademicPeriod} onAcademicYear={setAcademicYear} onPeriodStart={setPeriodStart} onPeriodEnd={setPeriodEnd} onProgrammeLabel={setProgrammeLabel} onGrantEmail={setGrantEmail} onGrantReason={setGrantReason} onGrantExpiresAt={setGrantExpiresAt} onCreateWorkspace={createWorkspace} onSetService={setWorkspaceService} onGrantAccess={grantWorkspaceAccess} onRevokeAccess={revokeWorkspaceAccess}/> : null}
            {view === 'groups' ? <GroupSyncView records={overview?.group_sync || []} source={overview?.sources.group_sync} workspaces={overview?.orchestration.workspaces || []} services={overview?.orchestration.services || []} enabledServices={overview?.orchestration.enabled_services || []} selectedWorkspaceId={selectedWorkspaceId} sessionName={sessionName} creating={creating} notice={actionNotice} noticeError={actionError} canManage={canManageGroupSync} onWorkspace={setSelectedWorkspaceId} onName={setSessionName} onCreate={createSession}/> : null}
            {view === 'schedule' ? <ScheduleView records={overview?.schedule || []} source={overview?.sources.schedule}/> : null}
            {view === 'spaces' ? <SpacesView records={overview?.spaces || []} source={overview?.sources.spaces}/> : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return <main className={styles.centered}><LoaderCircle className={styles.spinning} size={28}/><strong>Opening Continuum</strong></main>;
}

function ConfigurationScreen() {
  return <main className={styles.authPage}><section className={styles.authCard}>
    <Image src="/brand/afda-continuum-wordmark.svg" alt="AFDA Continuum" width={360} height={203} priority/>
    <div><span className={styles.authEyebrow}>Configuration required</span><h1>Connect Continuum to the existing AFDA tenant.</h1><p>Add <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and <code>NEXT_PUBLIC_CONTINUUM_API_URL</code> to this app. No credentials are embedded in source.</p><div className={styles.configPath}><Database size={18}/><span><strong>API target</strong><small>{continuumApiBase()}</small></span></div></div>
  </section></main>;
}

function SignInScreen({ email, password, busy, error, onEmail, onPassword, onSubmit }: { email: string; password: string; busy: boolean; error: string; onEmail: (value: string) => void; onPassword: (value: string) => void; onSubmit: (event: React.FormEvent) => void }) {
  return <main className={styles.authPage}><section className={styles.authCard}>
    <div className={styles.authBrand}><Image src="/brand/afda-continuum-wordmark.svg" alt="AFDA Continuum" width={420} height={236} priority/><p>One authenticated front door to the existing AFDA services.</p></div>
    <form onSubmit={onSubmit}><span className={styles.authEyebrow}>Operational platform</span><h1>Sign in to Continuum</h1><p>Use the same Supabase account configured for Schedule and WorkSuite.</p><label><span>Email address</span><input type="email" value={email} onChange={(event) => onEmail(event.target.value)} autoComplete="email" required/></label><label><span>Password</span><input type="password" value={password} onChange={(event) => onPassword(event.target.value)} autoComplete="current-password" required/></label>{error ? <div className={styles.formError} role="alert"><CircleAlert size={16}/>{error}</div> : null}<button type="submit" disabled={busy}>{busy ? <LoaderCircle className={styles.spinning} size={16}/> : <LogIn size={16}/>} {busy ? 'Signing in' : 'Sign in'}</button><small>Access remains governed by the role stored in the canonical users table.</small></form>
  </section></main>;
}

function PageHeading({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <header className={styles.pageHeading}><div><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div>{action}</header>;
}

function ErrorNotice({ message }: { message: string }) {
  return <div className={styles.errorNotice} role="alert"><CircleAlert size={18}/><span><strong>Live data could not be loaded</strong><small>{message}</small></span></div>;
}

function ActionNotice({ message, error }: { message: string; error: boolean }) {
  return <div className={error ? styles.actionError : styles.actionNotice} role={error ? 'alert' : 'status'}>{error ? <CircleAlert size={17}/> : <Check size={17}/>}<span>{message}</span></div>;
}

function SourceCard({ name, copy, source, count, onOpen }: { name: string; copy: string; source?: SourceState; count: number; onOpen: () => void }) {
  return <button type="button" className={styles.sourceCard} onClick={onOpen}><span className={source?.available ? styles.sourceOnline : styles.sourceOffline}><Link2 size={17}/></span><span><strong>{name}</strong><small>{copy}</small></span><span><b>{source?.available ? count : '—'}</b><small>{source?.available ? 'live records' : 'unavailable'}</small></span><ArrowRight size={16}/></button>;
}

function Overview({ overview, loading, onNavigate }: { overview: ContinuumOverview | null; loading: boolean; onNavigate: (view: OperationalView) => void }) {
  const activity = useMemo(() => {
    if (!overview) return [];
    return [
      ...overview.group_sync.slice(0, 2).map((record) => ({ type: 'Group Sync', title: record.name || record.code, detail: `${record.status} · ${record.participant_count} participants`, date: record.updated_at })),
      ...overview.schedule.slice(0, 2).map((record) => ({ type: 'Schedule', title: record.title, detail: `${record.status} · ${record.booking_count || 0} bookings`, date: record.updated_at })),
      ...overview.spaces.slice(0, 2).map((record) => ({ type: 'Spaces', title: relatedName(record.venue), detail: record.status, date: record.created_at })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [overview]);

  return <>
    <PageHeading eyebrow="Live operational view" title="Existing services, one governed entry point." copy="Continuum is reading current records from the canonical backend. It does not copy ownership or infer a BCom relationship that has not been configured."/>
    <section className={styles.mappingNotice}><ShieldCheck size={20}/><span><strong>BCom mapping is deliberately not inferred.</strong><small>{overview?.mapping.explanation || 'Waiting for the live platform response.'}</small></span><a href="/presentation">View the fictional BCom proposal <ExternalLink size={13}/></a></section>
    <div className={styles.sourceGrid}>
      <SourceCard name="Group Sync" copy="Sessions, generated groups and participants" source={overview?.sources.group_sync} count={overview?.group_sync.length || 0} onOpen={() => onNavigate('groups')}/>
      <SourceCard name="Schedule" copy="Batches, slots, bookings and attendance" source={overview?.sources.schedule} count={overview?.schedule.length || 0} onOpen={() => onNavigate('schedule')}/>
      <SourceCard name="Spaces & Resources" copy="Requests owned by the signed-in user" source={overview?.sources.spaces} count={overview?.spaces.length || 0} onOpen={() => onNavigate('spaces')}/>
    </div>
    <section className={styles.focusSurface}>
      <div><span>Current platform state</span><h2>{loading ? 'Reading the canonical sources…' : overview ? 'Live records are available.' : 'Sign-in succeeded; source data is loading.'}</h2><p>Last refreshed {overview ? formatDate(overview.refreshed_at, true) : '—'}. All writes continue through an owning service.</p></div>
      <dl><div><dt>Identity</dt><dd>{overview?.profile.email || 'Authenticated user'}</dd></div><div><dt>Role</dt><dd>{overview?.profile.role_v2 || 'Loading'}</dd></div><div><dt>Department</dt><dd>{overview?.profile.department || 'Not supplied'}</dd></div></dl>
    </section>
    <section className={styles.panel}><div className={styles.panelHeading}><div><h2>Recent source activity</h2><p>Latest records returned by the existing applications.</p></div><span>Read-only aggregation</span></div>{activity.length ? activity.map((item) => <div className={styles.activityRow} key={`${item.type}-${item.title}-${item.date}`}><span>{item.type}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{formatDate(item.date, true)}</time></div>) : <EmptyState title="No source records returned" copy="The connected tables are available but currently contain no records for this view."/>}</section>
  </>;
}

function WorkspaceSetupView({ overview, selectedWorkspaceId, institutionName, institutionShortName, workspaceName, schoolCode, academicPeriod, academicYear, periodStart, periodEnd, programmeLabel, grantEmail, grantReason, grantExpiresAt, busy, notice, noticeError, onSelectWorkspace, onInstitutionName, onInstitutionShortName, onWorkspaceName, onSchoolCode, onAcademicPeriod, onAcademicYear, onPeriodStart, onPeriodEnd, onProgrammeLabel, onGrantEmail, onGrantReason, onGrantExpiresAt, onCreateWorkspace, onSetService, onGrantAccess, onRevokeAccess }: {
  overview: ContinuumOverview | null;
  selectedWorkspaceId: string;
  institutionName: string;
  institutionShortName: string;
  workspaceName: string;
  schoolCode: string;
  academicPeriod: string;
  academicYear: string;
  periodStart: string;
  periodEnd: string;
  programmeLabel: string;
  grantEmail: string;
  grantReason: string;
  grantExpiresAt: string;
  busy: string;
  notice: string;
  noticeError: boolean;
  onSelectWorkspace: (value: string) => void;
  onInstitutionName: (value: string) => void;
  onInstitutionShortName: (value: string) => void;
  onWorkspaceName: (value: string) => void;
  onSchoolCode: (value: string) => void;
  onAcademicPeriod: (value: string) => void;
  onAcademicYear: (value: string) => void;
  onPeriodStart: (value: string) => void;
  onPeriodEnd: (value: string) => void;
  onProgrammeLabel: (value: string) => void;
  onGrantEmail: (value: string) => void;
  onGrantReason: (value: string) => void;
  onGrantExpiresAt: (value: string) => void;
  onCreateWorkspace: (event: React.FormEvent) => void;
  onSetService: (serviceId: string, enabled: boolean) => void;
  onGrantAccess: (event: React.FormEvent) => void;
  onRevokeAccess: (grantId: string) => void;
}) {
  const orchestration = overview?.orchestration;
  const selected = orchestration?.workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null;
  const admin = overview?.profile.role_v2 === 'admin';
  const currentServices = new Map((orchestration?.enabled_services || []).filter((item) => item.workspace_id === selectedWorkspaceId).map((item) => [item.service_id, item]));
  const groupService = orchestration?.services.find((service) => service.service_type === 'groups');
  const groupEnabled = Boolean(groupService && currentServices.get(groupService.id)?.enabled);
  const workspaceGrants = (orchestration?.access_grants || []).filter((grant) => grant.workspace_id === selectedWorkspaceId);

  return <>
    <PageHeading eyebrow="Orchestration setup" title="Show the input before the result." copy="Configure an explicit school workspace, enable an existing service, then follow every submitted action to its source-owned result."/>
    {!orchestration?.available ? <ErrorNotice message={orchestration?.error || 'Migration 009 must be applied before workspace setup can be used.'}/> : null}
    {notice ? <ActionNotice message={notice} error={noticeError}/> : null}
    <div className={styles.setupGrid}>
      <section className={styles.setupPanel}>
        <div className={styles.panelHeading}><div><h2>1. Create a school workspace</h2><p>This is the setup input—not an inferred label.</p></div><span>Admin action</span></div>
        <form className={styles.setupForm} onSubmit={onCreateWorkspace}>
          <div className={styles.formColumns}><label><span>Institution</span><input value={institutionName} onChange={(event) => onInstitutionName(event.target.value)} minLength={2} maxLength={160} required/></label><label><span>Short name</span><input value={institutionShortName} onChange={(event) => onInstitutionShortName(event.target.value)} minLength={2} maxLength={40} required/></label></div>
          <div className={styles.formColumns}><label><span>Workspace name</span><input value={workspaceName} onChange={(event) => onWorkspaceName(event.target.value)} minLength={2} maxLength={160} required/></label><label><span>School code</span><input value={schoolCode} onChange={(event) => onSchoolCode(event.target.value.toUpperCase())} pattern="[A-Z0-9-]{2,30}" maxLength={30} required/></label></div>
          <label><span>Programme label</span><input value={programmeLabel} onChange={(event) => onProgrammeLabel(event.target.value)} maxLength={200}/></label>
          <div className={styles.formColumns}><label><span>Academic period</span><input value={academicPeriod} onChange={(event) => onAcademicPeriod(event.target.value)} placeholder="e.g. Term 3" maxLength={80} required/></label><label><span>Academic year</span><input type="number" min="2000" max="2200" value={academicYear} onChange={(event) => onAcademicYear(event.target.value)} required/></label></div>
          <div className={styles.formColumns}><label><span>Period starts</span><input type="date" value={periodStart} onChange={(event) => onPeriodStart(event.target.value)} required/></label><label><span>Period ends</span><input type="date" value={periodEnd} onChange={(event) => onPeriodEnd(event.target.value)} required/></label></div>
          <button type="submit" disabled={!admin || !orchestration?.available || busy === 'workspace'}>{busy === 'workspace' ? <LoaderCircle className={styles.spinning} size={15}/> : <Settings2 size={15}/>} Create configured workspace</button>
          {!admin ? <small>Workspace creation is restricted to the canonical admin role.</small> : null}
        </form>
      </section>

      <section className={styles.setupPanel}>
        <div className={styles.panelHeading}><div><h2>2. Select the workspace</h2><p>All following service inputs use this explicit scope.</p></div><span>{orchestration?.workspaces.length || 0} configured</span></div>
        <div className={styles.workspaceChoices}>{orchestration?.workspaces.length ? orchestration.workspaces.map((workspace) => { const period = orchestration.periods.find((item) => item.id === workspace.active_period_id); return <button key={workspace.id} type="button" className={workspace.id === selectedWorkspaceId ? styles.selectedChoice : undefined} onClick={() => onSelectWorkspace(workspace.id)}><span><strong>{workspace.name}</strong><small>{workspace.code} · {period ? `${period.name} ${period.academic_year}` : 'Period not supplied'}</small></span><span className={styles.status}>{workspace.status}</span></button>; }) : <EmptyState title="No workspace has been configured" copy="Submit the setup form to create BCom or another approved school workspace."/>}</div>
      </section>
    </div>

    <section className={styles.panel}>
      <div className={styles.panelHeading}><div><h2>3. Enable services for {selected?.name || 'a workspace'}</h2><p>Services retain their source tables and detailed workflows.</p></div><span>Explicit configuration</span></div>
      {(orchestration?.services || []).map((service) => {
        const current = currentServices.get(service.id);
        return <div className={styles.serviceSetupRow} key={service.id}><span><strong>{service.name}</strong><small>{service.owner || 'AFDA service owner'} · source type: {service.service_type}{service.service_type === 'spaces' ? ' · controlled testing' : ''}</small></span><span className={styles.status}>{current?.enabled ? 'enabled' : 'not enabled'}</span><button type="button" disabled={!admin || !selected || Boolean(busy)} onClick={() => onSetService(service.id, !current?.enabled)}>{busy === service.id ? 'Saving…' : current?.enabled ? 'Disable' : service.service_type === 'spaces' ? 'Enable testing' : 'Enable service'}</button></div>;
      })}
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHeading}><div><h2>4. Grant scoped Group Sync access</h2><p>Authority is attached to an existing staff identity, this workspace and an expiry.</p></div><span>{workspaceGrants.filter((grant) => grant.active).length} active</span></div>
      {admin ? <form className={styles.accessForm} onSubmit={onGrantAccess}>
        <label htmlFor="grant-email"><span>Existing staff email</span><input id="grant-email" type="email" value={grantEmail} onChange={(event) => onGrantEmail(event.target.value)} placeholder="lecturer@afda.co.za" required/></label>
        <label htmlFor="grant-expiry"><span>Expires</span><input id="grant-expiry" type="datetime-local" value={grantExpiresAt} onChange={(event) => onGrantExpiresAt(event.target.value)} required/></label>
        <label htmlFor="grant-reason"><span>Reason</span><input id="grant-reason" value={grantReason} onChange={(event) => onGrantReason(event.target.value)} minLength={5} maxLength={300} required/></label>
        <button type="submit" disabled={!selected || !groupEnabled || Boolean(busy)}>{busy === 'grant' ? <LoaderCircle className={styles.spinning} size={15}/> : <ShieldCheck size={15}/>} Grant Group Sync access</button>
        {!groupEnabled ? <small>Enable Group Sync for this workspace before issuing a grant.</small> : null}
      </form> : <div className={styles.readOnlyNote}>Only a Continuum administrator can issue or revoke scoped access.</div>}
      {workspaceGrants.length ? workspaceGrants.map((grant) => <div className={styles.grantRow} key={grant.id}>
        <span><strong>{grant.user?.email || 'Current staff identity'}</strong><small>{grant.capabilities.join(', ').replaceAll('_', ' ')} · {grant.reason}</small></span>
        <span><strong>{grant.active ? 'Active' : grant.revoked_at ? 'Revoked' : 'Expired'}</strong><small>{grant.expires_at ? `Until ${formatDate(grant.expires_at, true)}` : 'No expiry'}</small></span>
        {admin && grant.active ? <button type="button" disabled={Boolean(busy)} onClick={() => onRevokeAccess(grant.id)}>{busy === grant.id ? 'Revoking…' : 'Revoke'}</button> : null}
      </div>) : <EmptyState title="No scoped access grants" copy="Grant a fictional lecturer, tutor or ad hoc assessor access after their canonical staff profile exists."/>}
    </section>

    <section className={styles.panel}>
      <div className={styles.panelHeading}><div><h2>5. Input → source result lineage</h2><p>Every governed action records what was submitted and what the owning service produced.</p></div><span>{orchestration?.workflow_runs.length || 0} recent runs</span></div>
      {orchestration?.workflow_runs.length ? orchestration.workflow_runs.map((run) => <div className={styles.lineageRow} key={run.id}><span><strong>{run.action_key.replaceAll('_', ' ')}</strong><small>{String(run.input_snapshot.name || 'Structured input recorded')}</small></span><ChevronRight size={15}/><span><strong>{run.source_table || 'No source result'}</strong><small>{run.source_record_id || run.error_message || 'Awaiting source record'}</small></span><span className={styles.status}>{run.status}</span></div>) : <EmptyState title="No workflow lineage yet" copy="Enable Group Sync, create a session, and the submitted input and resulting source record will appear here."/>}
    </section>
  </>;
}

function GroupSyncView({ records, source, workspaces, services, enabledServices, selectedWorkspaceId, sessionName, creating, notice, noticeError, canManage, onWorkspace, onName, onCreate }: { records: GroupSyncRecord[]; source?: SourceState; workspaces: ContinuumWorkspace[]; services: ContinuumService[]; enabledServices: ContinuumWorkspaceService[]; selectedWorkspaceId: string; sessionName: string; creating: boolean; notice: string; noticeError: boolean; canManage: boolean; onWorkspace: (value: string) => void; onName: (value: string) => void; onCreate: (event: React.FormEvent) => void }) {
  const groupService = services.find((service) => service.service_type === 'groups');
  const enabled = Boolean(groupService && enabledServices.some((item) => item.workspace_id === selectedWorkspaceId && item.service_id === groupService.id && item.enabled));
  return <>
    <PageHeading eyebrow="Existing service · write-through enabled" title="Group Sync" copy="Create a real grouping session and inspect the current sessions already owned by Group Sync." action={serviceUrls.groups ? <a className={styles.secondaryAction} href={serviceUrls.groups} target="_blank" rel="noreferrer">Open Group Sync <ExternalLink size={14}/></a> : null}/>
    <section className={styles.createSurface}><div><span>Governed input</span><h2>Create a Group Sync session</h2><p>Continuum records this input, writes to <code>sync_sessions</code>, links the result to the selected workspace and appends an audit event.</p></div><form onSubmit={onCreate}><label htmlFor="group-workspace">Workspace</label><select id="group-workspace" value={selectedWorkspaceId} onChange={(event) => onWorkspace(event.target.value)} required><option value="">Select a configured workspace</option>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select><label htmlFor="session-name">Session name</label><div><input id="session-name" value={sessionName} onChange={(event) => onName(event.target.value)} placeholder="e.g. Venture Lab team formation" minLength={3} maxLength={120} required/><button type="submit" disabled={creating || !source?.available || !enabled || !canManage}>{creating ? <LoaderCircle className={styles.spinning} size={15}/> : <Users size={15}/>} Create traced session</button></div>{selectedWorkspaceId && !enabled ? <small>Enable Group Sync for this workspace in Workspace setup first.</small> : null}{selectedWorkspaceId && enabled && !canManage ? <small>Your account needs an active Group Sync capability grant for this workspace.</small> : null}</form></section>
    {notice ? <ActionNotice message={notice} error={noticeError}/> : null}
    <RecordHeader title="Current Group Sync sessions" count={records.length} source={source}/>
    <div className={styles.recordList}>{records.length ? records.map((record) => <GroupRow key={record.id} record={record}/>) : <EmptyState title="No Group Sync sessions found" copy="Create the first live session above, or open Group Sync directly."/>}</div>
  </>;
}

function GroupRow({ record }: { record: GroupSyncRecord }) {
  const href = serviceUrls.groups ? `${serviceUrls.groups.replace(/\/$/, '')}/room/${record.code}?host=true` : '';
  return <article className={styles.recordRow}><span className={styles.recordIcon}><Users size={17}/></span><span><strong>{record.name || 'Group Sync session'}</strong><small>Code {record.code} · {record.participant_count} participants · {record.group_count} groups</small></span><span className={styles.status}>{record.status}</span><time>{formatDate(record.updated_at, true)}</time>{href ? <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${record.name || record.code} in Group Sync`}><ExternalLink size={15}/></a> : <span/>}</article>;
}

function ScheduleView({ records, source }: { records: ScheduleRecord[]; source?: SourceState }) {
  return <>
    <PageHeading eyebrow="Existing service · live read" title="Schedule" copy="These are current scheduling batches from the canonical backend. Editing, publishing and attendance remain inside Schedule." action={serviceUrls.schedule ? <a className={styles.secondaryAction} href={serviceUrls.schedule} target="_blank" rel="noreferrer">Open Schedule <ExternalLink size={14}/></a> : null}/>
    <RecordHeader title="Current scheduling batches" count={records.length} source={source}/>
    <div className={styles.recordList}>{records.length ? records.map((record) => <ScheduleRow key={record.id} record={record}/>) : <EmptyState title="No scheduling batches found" copy="Create scheduling work in the Schedule application; Continuum will read it here."/>}</div>
  </>;
}

function ScheduleRow({ record }: { record: ScheduleRecord }) {
  const href = serviceUrls.schedule ? `${serviceUrls.schedule.replace(/\/$/, '')}/editor/${record.id}` : '';
  return <article className={styles.recordRow}><span className={styles.recordIcon}><CalendarDays size={17}/></span><span><strong>{record.title}</strong><small>{formatDate(record.date_range_start)} – {formatDate(record.date_range_end)} · {relatedName(record.venue)}</small></span><span className={styles.status}>{record.status}</span><time>{record.booking_count || 0} bookings · {record.total_slots || 0} slots</time>{href ? <a href={href} target="_blank" rel="noreferrer" aria-label={`Open ${record.title} in Schedule`}><ExternalLink size={15}/></a> : <span/>}</article>;
}

function SpacesView({ records, source }: { records: SpaceRequestRecord[]; source?: SourceState }) {
  return <>
    <PageHeading eyebrow="Existing service · signed-in user scope" title="Spaces & Resources" copy="Continuum reads only the current user’s requests here. Request creation and operational approval remain with WorkSuite." action={serviceUrls.spaces ? <a className={styles.secondaryAction} href={serviceUrls.spaces} target="_blank" rel="noreferrer">Open WorkSuite <ExternalLink size={14}/></a> : null}/>
    <RecordHeader title="Your current space requests" count={records.length} source={source}/>
    <div className={styles.recordList}>{records.length ? records.map((record) => <article className={styles.recordRow} key={record.id}><span className={styles.recordIcon}><MapPin size={17}/></span><span><strong>{relatedName(record.venue)}</strong><small>{record.request_reason || 'No reason supplied'} · {record.start_time ? formatDate(record.start_time, true) : 'Time not supplied'}</small></span><span className={styles.status}>{record.status}</span><time>{formatDate(record.created_at, true)}</time><span/></article>) : <EmptyState title="No requests found for this account" copy="Open WorkSuite to create or manage a real space request."/>}</div>
  </>;
}

function RecordHeader({ title, count, source }: { title: string; count: number; source?: SourceState }) {
  return <div className={styles.recordHeader}><div><h2>{title}</h2><p>{count} records returned by the owning service</p></div><span className={source?.available ? styles.available : styles.unavailable}>{source?.available ? 'Source available' : 'Source unavailable'}</span></div>;
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className={styles.empty}><Database size={21}/><strong>{title}</strong><span>{copy}</span></div>;
}
