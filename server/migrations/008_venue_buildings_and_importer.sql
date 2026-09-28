-- Migration 008: Add building to venues and import_source to requests

-- Add building to venues
ALTER TABLE public.venues
  ADD COLUMN IF NOT EXISTS building character varying;

-- Backfill building with a default
UPDATE public.venues SET building = 'Main Campus' WHERE building IS NULL;

-- Add import_source to track where requests came from (e.g. 'Main Campus', 'Atlas', or 'adhoc')
ALTER TABLE public.venue_booking_requests
  ADD COLUMN IF NOT EXISTS import_source character varying DEFAULT 'adhoc';

-- Backfill import_source
UPDATE public.venue_booking_requests SET import_source = 'adhoc' WHERE import_source IS NULL;
