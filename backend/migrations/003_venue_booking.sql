-- ============================================================================
-- AFDA Booking Platform — Venue Booking Incremental Migration
-- ============================================================================
-- Apply this migration to an existing Supabase project that already contains
-- the shared student/slot schema. It adds only the venue booking tables and
-- venue-specific columns needed by the new Ops workflow.

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

-- Ensure the column exists when `venues` was previously created without it
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS ops_owner_id UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_venues_ops_owner_id ON venues(ops_owner_id);
CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);

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

CREATE INDEX IF NOT EXISTS idx_blackout_windows_venue_id ON blackout_windows(venue_id);
CREATE INDEX IF NOT EXISTS idx_blackout_windows_date_range ON blackout_windows(start_date, end_date);

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

ALTER TABLE venue_booking_requests
  ADD COLUMN IF NOT EXISTS request_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_venue_booking_requests_batch_id ON venue_booking_requests(batch_id);
CREATE INDEX IF NOT EXISTS idx_venue_booking_requests_requested_by ON venue_booking_requests(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_booking_requests_status ON venue_booking_requests(status);

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id);

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS public_view_token VARCHAR(64);

UPDATE batches
SET public_view_token = replace(uuid_generate_v4()::text, '-', '')
WHERE public_view_token IS NULL;

ALTER TABLE batches
  ALTER COLUMN public_view_token SET DEFAULT replace(uuid_generate_v4()::text, '-', '');

CREATE UNIQUE INDEX IF NOT EXISTS idx_batches_public_view_token ON batches(public_view_token);
