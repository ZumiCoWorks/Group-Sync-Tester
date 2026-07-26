-- 1. System config (POC: edited via SQL, not a UI)
CREATE TABLE IF NOT EXISTS public.sys_config (
  key character varying PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.sys_config (key, value) VALUES
('notice_period_hours', '48'),
('lockout_day', '"Thursday"'),
('lockout_time', '"14:00"')
ON CONFLICT (key) DO NOTHING;

-- 2. Teams webhook per school (POC: one row per department)
CREATE TABLE IF NOT EXISTS public.teams_webhooks (
  department character varying PRIMARY KEY,
  webhook_url text NOT NULL
);

-- 3. Venues: ownership is now required, visibility is new
-- Note: ops_owner_id already exists in venues, but we need owning_department to match user's department string.
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS owning_department character varying;

-- Backfill owning_department for existing rows so we can make it NOT NULL
UPDATE public.venues SET owning_department = 'Business' WHERE owning_department IS NULL;

ALTER TABLE public.venues
  ALTER COLUMN owning_department SET NOT NULL,
  ADD COLUMN IF NOT EXISTS visibility character varying NOT NULL DEFAULT 'shared'
    CHECK (visibility IN ('shared', 'exclusive'));

-- 4. Booking requests: direct requests, timestamptz, Teams notification tracking
ALTER TABLE public.venue_booking_requests
  ALTER COLUMN batch_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS start_time timestamptz,
  ADD COLUMN IF NOT EXISTS end_time timestamptz,
  ADD COLUMN IF NOT EXISTS request_reason text,
  ADD COLUMN IF NOT EXISTS requester_department character varying,
  ADD COLUMN IF NOT EXISTS teams_notification_sent boolean DEFAULT false;

-- 5. Overlap integrity: exclusion constraint instead of app-level checking only
ALTER TABLE public.venue_booking_requests
  ADD COLUMN IF NOT EXISTS booking_range tstzrange
    GENERATED ALWAYS AS (tstzrange(start_time, end_time)) STORED;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Safely add constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_approved_bookings'
  ) THEN
    ALTER TABLE public.venue_booking_requests
      ADD CONSTRAINT no_overlapping_approved_bookings
      EXCLUDE USING gist (
        venue_id WITH =,
        booking_range WITH &&
      ) WHERE (status = 'approved');
  END IF;
END $$;

-- 6. RLS Policies
-- sys_config: readable by all authenticated
ALTER TABLE public.sys_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY sys_config_read ON public.sys_config FOR SELECT TO authenticated USING (true);
CREATE POLICY sys_config_admin_all ON public.sys_config TO authenticated USING (
  (SELECT role_v2 FROM public.users WHERE id = auth.uid()) = 'admin'
);

-- teams_webhooks: only Admin can manage, Ops can read
ALTER TABLE public.teams_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_webhooks_read ON public.teams_webhooks FOR SELECT TO authenticated USING (
  (SELECT role_v2 FROM public.users WHERE id = auth.uid()) IN ('admin', 'ops_venue_admin')
);
CREATE POLICY teams_webhooks_admin ON public.teams_webhooks TO authenticated USING (
  (SELECT role_v2 FROM public.users WHERE id = auth.uid()) = 'admin'
);
