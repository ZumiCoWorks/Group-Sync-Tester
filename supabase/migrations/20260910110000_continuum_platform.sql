-- Continuum platform context and cross-service activities.
-- Additive only. Existing operational tables remain owned by their applications.

CREATE TABLE IF NOT EXISTS continuum_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS continuum_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES continuum_institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  academic_year INTEGER NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS continuum_periods_identity_idx
  ON continuum_periods(institution_id, name, academic_year);

CREATE TABLE IF NOT EXISTS continuum_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES continuum_institutions(id) ON DELETE CASCADE,
  active_period_id UUID REFERENCES continuum_periods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  programme_label TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (institution_id, code)
);

CREATE TABLE IF NOT EXISTS continuum_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL,
  base_url TEXT NOT NULL,
  return_url TEXT,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'configured' CHECK (status IN ('configured', 'unavailable', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS continuum_workspace_services (
  workspace_id UUID NOT NULL REFERENCES continuum_workspaces(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES continuum_services(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, service_id)
);

CREATE TABLE IF NOT EXISTS continuum_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES continuum_workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  course TEXT NOT NULL,
  starts_on DATE NOT NULL,
  owner_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('draft', 'preparing', 'active', 'complete', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS continuum_activity_services (
  activity_id UUID NOT NULL REFERENCES continuum_activities(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES continuum_services(id) ON DELETE CASCADE,
  external_record_id TEXT,
  handoff_status TEXT NOT NULL DEFAULT 'not_started' CHECK (handoff_status IN ('not_started', 'ready', 'opened', 'complete', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, service_id)
);

CREATE INDEX IF NOT EXISTS continuum_activities_workspace_idx ON continuum_activities(workspace_id, starts_on);
CREATE INDEX IF NOT EXISTS continuum_activity_services_activity_idx ON continuum_activity_services(activity_id);

ALTER TABLE continuum_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuum_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuum_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuum_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuum_workspace_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuum_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE continuum_activity_services ENABLE ROW LEVEL SECURITY;
