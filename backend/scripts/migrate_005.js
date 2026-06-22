#!/usr/bin/env node
// One-shot migration: add day/lunch time columns to batches table.
// Uses the Supabase service-role key via the REST API (no DATABASE_URL needed).

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Use the Supabase SQL execute endpoint (available with service role key)
const sql = `
ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS day_start_time    VARCHAR(8) DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS day_end_time      VARCHAR(8) DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS lunch_break_start VARCHAR(8) DEFAULT '13:00',
  ADD COLUMN IF NOT EXISTS lunch_break_end   VARCHAR(8) DEFAULT '14:00';
`;

const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);

// Build the REST request body
const body = JSON.stringify({ query: sql });

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  },
};

console.log('Running migration against:', SUPABASE_URL);

// The Supabase /rest/v1/rpc/exec_sql endpoint may not exist on all projects.
// We'll use the pg-format-compatible endpoint instead.
// Fallback: attempt via the management API or display guidance.

const pgUrl = new URL(`${SUPABASE_URL}/rest/v1/`);

console.log(`
=======================================================
DATABASE MIGRATION REQUIRED
=======================================================
Please run the following SQL in your Supabase SQL editor
at https://app.supabase.com/project/evempddvzimznvphcbyh/editor

Copy and paste this:

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS day_start_time    VARCHAR(8) DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS day_end_time      VARCHAR(8) DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS lunch_break_start VARCHAR(8) DEFAULT '13:00',
  ADD COLUMN IF NOT EXISTS lunch_break_end   VARCHAR(8) DEFAULT '14:00';

This adds four columns so that the Day Start/End and Lunch
times you configure in the Batch Editor are saved to the
database and reloaded correctly when you revisit the editor.
=======================================================
`);

process.exit(0);
