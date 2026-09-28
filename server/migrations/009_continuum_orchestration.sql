-- ============================================================================
-- AFDA Continuum — Orchestration lineage extension
-- ============================================================================
-- Prerequisite: the existing Continuum platform migration at
-- supabase/migrations/20260910110000_continuum_platform.sql.
--
-- This migration extends that live schema. It does not recreate or replace the
-- existing institution, period, workspace, service, activity or handoff tables,
-- and it does not alter records owned by Schedule, Group Sync or WorkSuite.

-- Make institution setup idempotent for the canonical API.
CREATE UNIQUE INDEX IF NOT EXISTS continuum_institutions_name_idx
  ON public.continuum_institutions(name);

CREATE UNIQUE INDEX IF NOT EXISTS continuum_periods_identity_idx
  ON public.continuum_periods(institution_id, name, academic_year);

-- Add only orchestration metadata that the existing workspace schema lacks.
ALTER TABLE public.continuum_workspaces
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES public.users(id);

ALTER TABLE public.continuum_workspace_services
  ADD COLUMN IF NOT EXISTS configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS enabled_by_user_id uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS enabled_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.continuum_workspace_services
SET enabled_at = COALESCE(enabled_at, created_at)
WHERE enabled = true AND enabled_at IS NULL;

-- Register the three source services without inventing live URLs. Continuum's
-- deployment environment remains authoritative for outbound application links.
INSERT INTO public.continuum_services (
  name,
  service_type,
  base_url,
  owner,
  status
) VALUES
  ('Group Sync', 'groups', 'continuum://group-sync', 'Group Sync', 'configured'),
  ('Schedule', 'schedule', 'continuum://schedule', 'Slot Booking', 'configured'),
  ('Spaces & Resources', 'spaces', 'continuum://spaces-resources', 'WorkSuite', 'configured')
ON CONFLICT (name) DO UPDATE SET
  service_type = EXCLUDED.service_type,
  owner = EXCLUDED.owner,
  updated_at = now();

-- Explicit relationship between an existing source-owned record and its
-- Continuum workspace/activity context.
CREATE TABLE IF NOT EXISTS public.continuum_record_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.continuum_workspaces(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.continuum_activities(id) ON DELETE SET NULL,
  service_id uuid NOT NULL REFERENCES public.continuum_services(id),
  source_table text NOT NULL
    CHECK (source_table IN ('batches', 'sync_sessions', 'venue_booking_requests')),
  source_record_id uuid NOT NULL,
  record_type text NOT NULL,
  relationship text NOT NULL DEFAULT 'context'
    CHECK (relationship IN ('primary', 'context', 'related')),
  linked_by_user_id uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, source_table, source_record_id)
);

CREATE INDEX IF NOT EXISTS continuum_record_links_source_idx
  ON public.continuum_record_links(source_table, source_record_id);
CREATE INDEX IF NOT EXISTS continuum_record_links_workspace_service_idx
  ON public.continuum_record_links(workspace_id, service_id);

-- Sanitised orchestration input, processing state and resulting source record.
CREATE TABLE IF NOT EXISTS public.continuum_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.continuum_workspaces(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.continuum_activities(id) ON DELETE SET NULL,
  service_id uuid NOT NULL REFERENCES public.continuum_services(id),
  action_key text NOT NULL,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'in_progress', 'succeeded', 'failed', 'cancelled')),
  input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(input_snapshot) = 'object'),
  result_snapshot jsonb
    CHECK (result_snapshot IS NULL OR jsonb_typeof(result_snapshot) = 'object'),
  source_table text
    CHECK (source_table IS NULL OR source_table IN ('batches', 'sync_sessions', 'venue_booking_requests')),
  source_record_id uuid,
  initiated_by_user_id uuid NOT NULL REFERENCES public.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (source_table IS NULL AND source_record_id IS NULL)
    OR (source_table IS NOT NULL AND source_record_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS continuum_workflow_runs_workspace_created_idx
  ON public.continuum_workflow_runs(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS continuum_workflow_runs_status_idx
  ON public.continuum_workflow_runs(status);
CREATE INDEX IF NOT EXISTS continuum_workflow_runs_source_idx
  ON public.continuum_workflow_runs(source_table, source_record_id);

-- Optional, time-bound authority below the canonical role_v2 baseline.
CREATE TABLE IF NOT EXISTS public.continuum_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.continuum_workspaces(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.continuum_services(id),
  capabilities text[] NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  reason text NOT NULL,
  granted_by_user_id uuid NOT NULL REFERENCES public.users(id),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cardinality(capabilities) > 0),
  CHECK (expires_at IS NULL OR expires_at > starts_at)
);

CREATE INDEX IF NOT EXISTS continuum_access_grants_user_scope_idx
  ON public.continuum_access_grants(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS continuum_access_grants_expiry_idx
  ON public.continuum_access_grants(expires_at)
  WHERE revoked_at IS NULL;

-- Maintain timestamps on the mutable orchestration records.
DROP TRIGGER IF EXISTS update_continuum_workspaces_timestamp
  ON public.continuum_workspaces;
CREATE TRIGGER update_continuum_workspaces_timestamp
  BEFORE UPDATE ON public.continuum_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_continuum_services_timestamp
  ON public.continuum_services;
CREATE TRIGGER update_continuum_services_timestamp
  BEFORE UPDATE ON public.continuum_services
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_continuum_workspace_services_timestamp
  ON public.continuum_workspace_services;
CREATE TRIGGER update_continuum_workspace_services_timestamp
  BEFORE UPDATE ON public.continuum_workspace_services
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_continuum_workflow_runs_timestamp
  ON public.continuum_workflow_runs;
CREATE TRIGGER update_continuum_workflow_runs_timestamp
  BEFORE UPDATE ON public.continuum_workflow_runs
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Browser access remains fail-closed. The canonical API uses the service role
-- and performs identity, role and scoped-capability checks.
ALTER TABLE public.continuum_record_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuum_workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuum_access_grants ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.continuum_record_links IS
  'Additive links to records owned by existing AFDA services.';
COMMENT ON TABLE public.continuum_workflow_runs IS
  'Sanitised command input, processing status and source-system result lineage.';
