-- Batch UI columns
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS day_start_time time,
  ADD COLUMN IF NOT EXISTS day_end_time time,
  ADD COLUMN IF NOT EXISTS lunch_break_start time,
  ADD COLUMN IF NOT EXISTS lunch_break_end time,
  ADD COLUMN IF NOT EXISTS max_batch_days integer NOT NULL DEFAULT 30;

-- Role reconciliation: finalized shared platform model
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role_v2 character varying
    CHECK (role_v2 IN (
      'student', 'tutor_junior', 'tutor_senior', 'lecturer',
      'adhoc', 'ops_venue_admin', 'admin'
    )),
  ADD COLUMN IF NOT EXISTS access_expires_at timestamptz;

-- Backfill: lecturer/admin map directly. Legacy 'staff' is left NULL
UPDATE public.users SET role_v2 = 'lecturer' WHERE role = 'lecturer';
UPDATE public.users SET role_v2 = 'admin' WHERE role = 'admin';

-- Drop old policies on users that depend on role
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "batches_insert_staff" ON batches;
DROP POLICY IF EXISTS "batches_update_own" ON batches;
DROP POLICY IF EXISTS "batches_select_published" ON batches;
DROP POLICY IF EXISTS "bookings_select_own_batch" ON bookings;
DROP POLICY IF EXISTS "bookings_delete_staff" ON bookings;
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;

-- Recreate policies using role_v2
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);

CREATE POLICY "batches_select_published" ON batches FOR SELECT USING (
  status = 'published' OR 
  auth.uid() = created_by_user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_v2 IN ('admin', 'ops_venue_admin'))
);

CREATE POLICY "batches_insert_staff" ON batches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_v2 IN ('tutor_junior', 'tutor_senior', 'lecturer', 'adhoc', 'admin'))
);

CREATE POLICY "batches_update_own" ON batches FOR UPDATE USING (
  auth.uid() = created_by_user_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_v2 = 'admin')
);

CREATE POLICY "bookings_select_own_batch" ON bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM batches WHERE id = batch_id AND (
      created_by_user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_v2 IN ('admin', 'ops_venue_admin'))
    )
  ) OR student_email = COALESCE(auth.jwt()->>'email', '')
);

CREATE POLICY "bookings_delete_staff" ON bookings FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM batches WHERE id = batch_id AND created_by_user_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_v2 IN ('admin', 'ops_venue_admin'))
);

CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role_v2 = 'admin') OR
  (resource_type = 'batch' AND EXISTS (
    SELECT 1 FROM batches WHERE id = resource_id::uuid AND created_by_user_id = auth.uid()
  ))
);
