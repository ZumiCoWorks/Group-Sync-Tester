-- Migration 005: Add day/lunch time columns to batches table
-- These store the user-configured working hours and lunch break so
-- they can be persisted and reloaded correctly in the editor.

ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS day_start_time   VARCHAR(8) DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS day_end_time     VARCHAR(8) DEFAULT '17:00',
  ADD COLUMN IF NOT EXISTS lunch_break_start VARCHAR(8) DEFAULT '13:00',
  ADD COLUMN IF NOT EXISTS lunch_break_end   VARCHAR(8) DEFAULT '14:00';
