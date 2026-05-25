ALTER TABLE batches
  ADD COLUMN IF NOT EXISTS public_view_token VARCHAR(64);

UPDATE batches
SET public_view_token = replace(uuid_generate_v4()::text, '-', '')
WHERE public_view_token IS NULL;

ALTER TABLE batches
  ALTER COLUMN public_view_token SET DEFAULT replace(uuid_generate_v4()::text, '-', '');

CREATE UNIQUE INDEX IF NOT EXISTS idx_batches_public_view_token ON batches(public_view_token);