-- Continuum bootstrap support: make academic-period upserts idempotent.
-- Additive only; no existing application tables are modified.

CREATE UNIQUE INDEX IF NOT EXISTS continuum_periods_identity_idx
  ON continuum_periods(institution_id, name, academic_year);
