-- ============================================================================
-- AFDA Booking Platform — Group Sync Schema
-- ============================================================================

-- Create sync_sessions table
CREATE TABLE IF NOT EXISTS sync_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL, -- 6-character uppercase code e.g., 'ABCDEF'
  name VARCHAR(255),
  host_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'lobby', -- 'lobby', 'grouped', 'ended'
  groups JSONB DEFAULT '[]'::jsonb, -- Store generated groups: Array of { id, members: [] }
  roster JSONB DEFAULT '[]'::jsonb, -- Store uploaded class list roster for matching disciplines/placements
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_sessions_code ON sync_sessions(code);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_status ON sync_sessions(status);

-- Create sync_participants table
CREATE TABLE IF NOT EXISTS sync_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sync_sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(50) NOT NULL, -- E.g. emojis or avatar keywords
  student_number VARCHAR(50),
  discipline VARCHAR(255),
  current_placement VARCHAR(255), -- Existing group from Tab 2
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_participants_session_id ON sync_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_sync_participants_student_number ON sync_participants(student_number);

-- Enable Row-Level Security (RLS)
ALTER TABLE sync_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_participants ENABLE ROW LEVEL SECURITY;

-- Simple permissive RLS policies for now to allow seamless student lobby interaction
CREATE POLICY "sync_sessions_permissive" ON sync_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "sync_participants_permissive" ON sync_participants FOR ALL USING (true) WITH CHECK (true);

-- Add triggers to update timestamps
CREATE TRIGGER update_sync_sessions_timestamp BEFORE UPDATE ON sync_sessions FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Enable Supabase Realtime for these tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE sync_sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE sync_participants;
  END IF;
END $$;
