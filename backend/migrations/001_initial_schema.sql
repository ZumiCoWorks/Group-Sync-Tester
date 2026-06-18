-- ============================================================================
-- AFDA Booking Platform — Supabase Database Schema
-- ============================================================================
-- Run this migration file in your Supabase project to create all tables
-- and indexes. Version 1.0 - Initial Schema

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student', -- 'student', 'staff', 'lecturer', 'ops', 'admin', 'integrator'
  domain VARCHAR(255), -- Institution domain (e.g., 'university.edu')
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_domain ON users(domain);

-- Venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  capacity INT NOT NULL DEFAULT 1,
  facilities TEXT[], -- Array of facility names
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  ops_owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venues_ops_owner_id ON venues(ops_owner_id);
CREATE INDEX idx_venues_name ON venues(name);

-- Venue availability table
CREATE TABLE venue_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(venue_id, day_of_week)
);

CREATE INDEX idx_venue_availability_venue_id ON venue_availability(venue_id);

-- Blackout windows table
CREATE TABLE blackout_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blackout_windows_venue_id ON blackout_windows(venue_id);
CREATE INDEX idx_blackout_windows_date_range ON blackout_windows(start_date, end_date);

-- Batches table
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'pending_venue_approval', 'published', 'archived', 'closed'
  venue_id UUID REFERENCES venues(id),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  slot_duration_minutes INT NOT NULL, -- Duration of each slot (e.g., 60)
  per_slot_capacity INT NOT NULL DEFAULT 1,
  batch_capacity INT, -- Total capacity across all slots (NULL = unlimited)
  booking_count INT DEFAULT 0,
  total_slots INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP
);

CREATE INDEX idx_batches_created_by_user_id ON batches(created_by_user_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_venue_id ON batches(venue_id);
CREATE INDEX idx_batches_published_at ON batches(published_at DESC);
CREATE INDEX idx_batches_date_range ON batches(date_range_start, date_range_end);

-- Slots table
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INT NOT NULL DEFAULT 1,
  booking_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_slots_batch_id ON slots(batch_id);
CREATE INDEX idx_slots_start_time ON slots(start_time);
CREATE INDEX idx_slots_batch_start_time ON slots(batch_id, start_time);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  student_id_external VARCHAR(255), -- For imported participants
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'waitlisted', 'cancelled', 'attended'
  confirmation_number VARCHAR(50) UNIQUE NOT NULL,
  booked_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  marked_attended_at TIMESTAMP
);

CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX idx_bookings_batch_id ON bookings(batch_id);
CREATE INDEX idx_bookings_student_email ON bookings(student_email);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_confirmation_number ON bookings(confirmation_number);

-- Venue booking requests table
CREATE TABLE venue_booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id),
  venue_id UUID NOT NULL REFERENCES venues(id),
  requested_by_user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'declined'
  request_notes TEXT,
  decline_reason TEXT,
  suggested_alternatives UUID[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  responded_by_user_id UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_venue_booking_requests_batch_id ON venue_booking_requests(batch_id);
CREATE INDEX idx_venue_booking_requests_requested_by ON venue_booking_requests(requested_by_user_id);
CREATE INDEX idx_venue_booking_requests_status ON venue_booking_requests(status);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- 'batch_created', 'booking_confirmed', etc.
  resource_type VARCHAR(50) NOT NULL, -- 'batch', 'booking', 'venue', 'user', 'import', 'system'
  resource_id VARCHAR(255) NOT NULL,
  details JSONB,
  changes JSONB, -- Stores {before, after} for updates
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Import jobs table
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES batches(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  total_rows INT NOT NULL,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  errors JSONB, -- Array of {rowNumber, error message}
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_jobs_batch_id ON import_jobs(batch_id);
CREATE INDEX idx_import_jobs_created_by_user_id ON import_jobs(created_by_user_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all public users (for reference)
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);

-- Policy: Batches are viewable if published (or user is creator/staff/admin)
CREATE POLICY "batches_select_published" ON batches FOR SELECT USING (
  status = 'published' OR 
  auth.uid() = created_by_user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Policy: Staff can create batches
CREATE POLICY "batches_insert_staff" ON batches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('staff', 'lecturer', 'admin'))
);

-- Policy: Staff can update their own batches
CREATE POLICY "batches_update_own" ON batches FOR UPDATE USING (
  auth.uid() = created_by_user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: Bookings are viewable by slot owner (via batch) or student
CREATE POLICY "bookings_select_own_batch" ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM batches WHERE id = batch_id AND (
      created_by_user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ops'))
    )
  ) OR student_email = COALESCE(auth.jwt()->>'email', '')
);

-- Policy: Anyone can create bookings (for public students)
CREATE POLICY "bookings_insert_public" ON bookings FOR INSERT WITH CHECK (true);

-- Policy: Staff can cancel bookings
CREATE POLICY "bookings_delete_staff" ON bookings FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM batches WHERE id = batch_id AND created_by_user_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Policy: Audit logs are viewable by admins and resource owners
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
  (resource_type = 'batch' AND EXISTS (
    SELECT 1 FROM batches WHERE id = resource_id::uuid AND created_by_user_id = auth.uid()
  ))
);

-- ============================================================================
-- Utility Functions
-- ============================================================================

-- Update updated_at timestamp on INSERT/UPDATE
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_batches_timestamp BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_slots_timestamp BEFORE UPDATE ON slots FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_bookings_timestamp BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_venues_timestamp BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- End of Schema
-- ============================================================================
