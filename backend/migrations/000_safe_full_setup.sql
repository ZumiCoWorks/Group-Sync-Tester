-- ============================================================================
-- AFDA Booking Platform — FULL SAFE SETUP (all migrations combined)
-- ============================================================================
-- Run this entire script once in your Supabase SQL editor.
-- Every statement uses IF NOT EXISTS so it is safe to run on a
-- fresh database OR one that already has some tables.
-- ============================================================================

-- ─── CORE TABLES ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  domain VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_domain ON users(domain);

-- Profiles (lightweight alias used by some auth flows)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'staff',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── VENUES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  capacity INT NOT NULL DEFAULT 1,
  facilities TEXT[],
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  ops_owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE venues ADD COLUMN IF NOT EXISTS ops_owner_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_venues_ops_owner_id ON venues(ops_owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_name         ON venues(name);

CREATE TABLE IF NOT EXISTS venue_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(venue_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_venue_availability_venue_id ON venue_availability(venue_id);

CREATE TABLE IF NOT EXISTS blackout_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blackout_windows_venue_id   ON blackout_windows(venue_id);
CREATE INDEX IF NOT EXISTS idx_blackout_windows_date_range ON blackout_windows(start_date, end_date);

-- ─── BATCHES ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  venue_id UUID REFERENCES venues(id),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  slot_duration_minutes INT NOT NULL,
  per_slot_capacity INT NOT NULL DEFAULT 1,
  batch_capacity INT,
  booking_count INT DEFAULT 0,
  total_slots INT DEFAULT 0,
  -- Time-of-day configuration (persisted so the editor reloads them)
  day_start_time    VARCHAR(8) DEFAULT '09:00',
  day_end_time      VARCHAR(8) DEFAULT '17:00',
  lunch_break_start VARCHAR(8) DEFAULT '13:00',
  lunch_break_end   VARCHAR(8) DEFAULT '14:00',
  -- Public sharing
  public_view_token VARCHAR(64) DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

-- Incremental additions (safe on existing tables too)
ALTER TABLE batches ADD COLUMN IF NOT EXISTS venue_id         UUID REFERENCES venues(id);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS public_view_token VARCHAR(64) DEFAULT replace(uuid_generate_v4()::text, '-', '');
ALTER TABLE batches ADD COLUMN IF NOT EXISTS day_start_time    VARCHAR(8) DEFAULT '09:00';
ALTER TABLE batches ADD COLUMN IF NOT EXISTS day_end_time      VARCHAR(8) DEFAULT '17:00';
ALTER TABLE batches ADD COLUMN IF NOT EXISTS lunch_break_start VARCHAR(8) DEFAULT '13:00';
ALTER TABLE batches ADD COLUMN IF NOT EXISTS lunch_break_end   VARCHAR(8) DEFAULT '14:00';

-- Back-fill public_view_token on any rows that don't have one
UPDATE batches
SET public_view_token = replace(uuid_generate_v4()::text, '-', '')
WHERE public_view_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_batches_created_by_user_id ON batches(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_batches_status             ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_venue_id           ON batches(venue_id);
CREATE INDEX IF NOT EXISTS idx_batches_published_at       ON batches(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_date_range         ON batches(date_range_start, date_range_end);
CREATE UNIQUE INDEX IF NOT EXISTS idx_batches_public_view_token ON batches(public_view_token);

-- ─── SLOTS ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  booking_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_slots_batch_id        ON slots(batch_id);
CREATE INDEX IF NOT EXISTS idx_slots_start_time      ON slots(start_time);
CREATE INDEX IF NOT EXISTS idx_slots_batch_start_time ON slots(batch_id, start_time);

-- ─── BOOKINGS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  student_id_external VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
  confirmation_number VARCHAR(50) UNIQUE NOT NULL,
  booked_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  marked_attended_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bookings_slot_id              ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_batch_id             ON bookings(batch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_email        ON bookings(student_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status               ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation_number  ON bookings(confirmation_number);

-- ─── VENUE BOOKING REQUESTS ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS venue_booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id),
  venue_id UUID NOT NULL REFERENCES venues(id),
  requested_by_user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  request_notes TEXT,
  decline_reason TEXT,
  suggested_alternatives UUID[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  responded_by_user_id UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE venue_booking_requests ADD COLUMN IF NOT EXISTS request_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_venue_booking_requests_batch_id     ON venue_booking_requests(batch_id);
CREATE INDEX IF NOT EXISTS idx_venue_booking_requests_requested_by ON venue_booking_requests(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_booking_requests_status       ON venue_booking_requests(status);

-- ─── AUDIT LOGS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  details JSONB,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id       ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id   ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action        ON audit_logs(action);

-- ─── IMPORT JOBS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  total_rows INT NOT NULL,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  errors JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_batch_id           ON import_jobs(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by_user_id ON import_jobs(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status             ON import_jobs(status);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ─── GROUP SYNC ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sync_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255),
  host_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'lobby',
  groups JSONB DEFAULT '[]'::jsonb,
  roster JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_sessions_code   ON sync_sessions(code);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_status ON sync_sessions(status);

CREATE TABLE IF NOT EXISTS sync_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sync_sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(50) NOT NULL,
  student_number VARCHAR(50),
  discipline VARCHAR(255),
  current_placement VARCHAR(255),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_participants_session_id    ON sync_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_sync_participants_student_number ON sync_participants(student_number);

-- ─── ROW-LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches                ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_participants      ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies safely
DO $$ BEGIN
  DROP POLICY IF EXISTS "users_select_all"             ON users;
  DROP POLICY IF EXISTS "batches_select_published"     ON batches;
  DROP POLICY IF EXISTS "batches_insert_staff"         ON batches;
  DROP POLICY IF EXISTS "batches_update_own"           ON batches;
  DROP POLICY IF EXISTS "bookings_select_own_batch"    ON bookings;
  DROP POLICY IF EXISTS "bookings_insert_public"       ON bookings;
  DROP POLICY IF EXISTS "bookings_delete_staff"        ON bookings;
  DROP POLICY IF EXISTS "audit_logs_select_admin"      ON audit_logs;
  DROP POLICY IF EXISTS "sync_sessions_permissive"     ON sync_sessions;
  DROP POLICY IF EXISTS "sync_participants_permissive" ON sync_participants;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);

CREATE POLICY "batches_select_published" ON batches FOR SELECT USING (
  status IN ('published', 'closed', 'archived') OR
  auth.uid() = created_by_user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ops', 'staff', 'lecturer'))
);

CREATE POLICY "batches_insert_staff" ON batches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'lecturer', 'admin'))
);

CREATE POLICY "batches_update_own" ON batches FOR UPDATE USING (
  auth.uid() = created_by_user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "bookings_select_own_batch" ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM batches WHERE id = batch_id AND (
      created_by_user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ops'))
    )
  ) OR student_email = COALESCE(auth.jwt()->>'email', '')
);

CREATE POLICY "bookings_insert_public"  ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "bookings_delete_staff"   ON bookings FOR DELETE USING (
  EXISTS (SELECT 1 FROM batches WHERE id = batch_id AND created_by_user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
  (resource_type = 'batch' AND EXISTS (
    SELECT 1 FROM batches WHERE id = resource_id::uuid AND created_by_user_id = auth.uid()
  ))
);

CREATE POLICY "sync_sessions_permissive"     ON sync_sessions     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "sync_participants_permissive" ON sync_participants  FOR ALL USING (true) WITH CHECK (true);

-- ─── TIMESTAMP TRIGGER ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_batches_timestamp       BEFORE UPDATE ON batches       FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_slots_timestamp         BEFORE UPDATE ON slots         FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_bookings_timestamp      BEFORE UPDATE ON bookings      FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_venues_timestamp        BEFORE UPDATE ON venues        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_users_timestamp         BEFORE UPDATE ON users         FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER update_sync_sessions_timestamp BEFORE UPDATE ON sync_sessions FOR EACH ROW EXECUTE FUNCTION update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── REALTIME ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sync_sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE sync_participants;
  END IF;
END $$;

-- ============================================================================
-- Done. All tables, indexes, policies, and triggers are now in place.
-- ============================================================================
