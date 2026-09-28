const apiBase = (process.env.NEXT_PUBLIC_CONTINUUM_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');

export type SourceState = {
  available: boolean;
  error: string | null;
};

export type ContinuumProfile = {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role_v2: string;
  department: string | null;
};

export type ScheduleRecord = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  date_range_start: string;
  date_range_end: string;
  booking_count: number;
  total_slots: number;
  updated_at: string;
  venue: { name: string } | Array<{ name: string }> | null;
  continuum_workspace_id: string | null;
};

export type GroupSyncRecord = {
  id: string;
  code: string;
  name: string | null;
  status: string;
  participant_count: number;
  group_count: number;
  created_at: string;
  updated_at: string;
  ended_at: string | null;
  continuum_workspace_id: string | null;
  workflow_run_id?: string;
};

export type SpaceRequestRecord = {
  id: string;
  status: string;
  request_reason: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  venue: { name: string } | Array<{ name: string }> | null;
  continuum_workspace_id: string | null;
};

export type ContinuumWorkspace = {
  id: string;
  institution_id: string;
  active_period_id: string | null;
  name: string;
  code: string;
  programme_label: string | null;
  status: 'draft' | 'active' | 'archived';
  description: string | null;
  configuration: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ContinuumInstitution = {
  id: string;
  name: string;
  short_name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type ContinuumPeriod = {
  id: string;
  institution_id: string;
  name: string;
  academic_year: number;
  starts_on: string;
  ends_on: string;
  status: 'draft' | 'active' | 'closed';
  created_at: string;
  updated_at: string;
};

export type ContinuumService = {
  id: string;
  name: string;
  service_type: string;
  base_url: string;
  return_url: string | null;
  owner: string | null;
  status: 'configured' | 'unavailable' | 'disabled';
  created_at: string;
  updated_at: string;
};

export type ContinuumWorkspaceService = {
  workspace_id: string;
  service_id: string;
  enabled: boolean;
  configuration: Record<string, unknown>;
  enabled_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContinuumWorkflowRun = {
  id: string;
  workspace_id: string;
  activity_id: string | null;
  service_id: string;
  action_key: string;
  status: 'requested' | 'in_progress' | 'succeeded' | 'failed' | 'cancelled';
  input_snapshot: Record<string, unknown>;
  result_snapshot: Record<string, unknown> | null;
  source_table: string | null;
  source_record_id: string | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ContinuumAccessGrant = {
  id: string;
  user_id: string;
  workspace_id: string;
  service_id: string | null;
  capabilities: string[];
  starts_at: string;
  expires_at: string | null;
  reason: string;
  granted_by_user_id: string;
  revoked_at: string | null;
  created_at: string;
  active: boolean;
  user: Pick<ContinuumProfile, 'id' | 'email' | 'first_name' | 'last_name' | 'role_v2'> | null;
};

export type ContinuumOverview = {
  profile: ContinuumProfile;
  schedule: ScheduleRecord[];
  group_sync: GroupSyncRecord[];
  spaces: SpaceRequestRecord[];
  sources: {
    schedule: SourceState;
    group_sync: SourceState;
    spaces: SourceState;
  };
  orchestration: {
    available: boolean;
    error: string | null;
    institutions: ContinuumInstitution[];
    periods: ContinuumPeriod[];
    workspaces: ContinuumWorkspace[];
    services: ContinuumService[];
    enabled_services: ContinuumWorkspaceService[];
    workflow_runs: ContinuumWorkflowRun[];
    access_grants: ContinuumAccessGrant[];
    effective_access: {
      is_admin: boolean;
      grants: ContinuumAccessGrant[];
    };
    record_links: Array<{
      id: string;
      workspace_id: string;
      activity_id: string | null;
      service_id: string;
      source_table: string;
      source_record_id: string;
      record_type: string;
      relationship: string;
      created_at: string;
    }>;
  };
  mapping: {
    bcom: 'not_configured' | 'configured' | 'archived';
    workspace_id: string | null;
    explanation: string;
  };
  refreshed_at: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
};

async function apiRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.error?.message || `Continuum API request failed (${response.status})`);
  }
  return payload.data;
}

export function continuumApiBase() {
  return apiBase;
}

export function loadContinuumOverview(token: string, signal?: AbortSignal) {
  return apiRequest<ContinuumOverview>('/api/continuum/overview', token, { signal });
}

export function createContinuumWorkspace(token: string, input: {
  institution_name: string;
  institution_short_name: string;
  timezone?: string;
  period_name: string;
  academic_year: number;
  starts_on: string;
  ends_on: string;
  name: string;
  school_code?: string;
  programme_label?: string;
  description?: string;
}) {
  return apiRequest<{ institution: ContinuumInstitution; period: ContinuumPeriod; workspace: ContinuumWorkspace }>('/api/continuum/workspaces', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateContinuumWorkspaceService(token: string, workspaceId: string, input: {
  service_id: string;
  enabled: boolean;
  configuration?: Record<string, unknown>;
}) {
  return apiRequest<ContinuumWorkspaceService>(`/api/continuum/workspaces/${workspaceId}/services`, token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createContinuumAccessGrant(token: string, workspaceId: string, input: {
  user_email: string;
  service_id: string | null;
  capabilities: string[];
  expires_at: string | null;
  reason: string;
}) {
  return apiRequest<ContinuumAccessGrant>(`/api/continuum/workspaces/${workspaceId}/access-grants`, token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function revokeContinuumAccessGrant(token: string, grantId: string) {
  return apiRequest<ContinuumAccessGrant>(`/api/continuum/access-grants/${grantId}/revoke`, token, {
    method: 'POST',
  });
}

export function createContinuumGroupSession(token: string, workspaceId: string, name: string) {
  return apiRequest<GroupSyncRecord>('/api/continuum/group-sync/sessions', token, {
    method: 'POST',
    body: JSON.stringify({ workspace_id: workspaceId, name }),
  });
}

export function linkContinuumGroupSession(token: string, workspaceId: string, sessionId: string) {
  return apiRequest<{
    id: string;
    workspace_id: string;
    service_id: string;
    source_table: 'sync_sessions';
    source_record_id: string;
    record_type: string;
    relationship: string;
    created_at: string;
  }>(`/api/continuum/group-sync/sessions/${sessionId}/link`, token, {
    method: 'POST',
    body: JSON.stringify({ workspace_id: workspaceId }),
  });
}
