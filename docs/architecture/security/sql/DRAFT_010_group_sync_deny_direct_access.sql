-- DRAFT ONLY — DO NOT APPLY.
--
-- This file is intentionally outside every executable migration directory.
-- It is a DBA/security review artifact, not an approved migration.
--
-- Intended outcome:
--   * browser roles (`anon` and `authenticated`) cannot read or mutate the
--     Group Sync tables directly;
--   * the canonical backend remains the only data-access path and continues
--     to use the `service_role` database role; and
--   * the tables are removed from the Supabase Realtime publication because
--     the current Group Sync client uses API polling, not direct Realtime.
--
-- Required before execution in any environment:
--   1. identify the canonical migration authority and applied migration history;
--   2. confirm the target database/environment and exact release commit;
--   3. confirm backup/PITR state and name the DBA rollback owner;
--   4. prove the legacy `backend/` deployment is not serving traffic;
--   5. deploy and verify the API-only Group Sync client/backend first;
--   6. validate this draft against a non-production database with synthetic data;
--   7. obtain Security, DBA, DevOps, Group Sync owner, and Privacy approval.

BEGIN;

DO $preflight$
DECLARE
  unexpected_policies text;
BEGIN
  IF to_regclass('public.sync_sessions') IS NULL
     OR to_regclass('public.sync_participants') IS NULL THEN
    RAISE EXCEPTION 'Group Sync tables are missing from the target database';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
     OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    RAISE EXCEPTION 'Expected Supabase database roles are missing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname IN ('anon', 'authenticated')
      AND (rolbypassrls OR rolsuper)
  ) THEN
    RAISE EXCEPTION 'A browser role can bypass RLS; stop for DBA review';
  END IF;

  IF NOT COALESCE(
    (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'service_role'),
    false
  ) THEN
    RAISE EXCEPTION 'service_role does not have BYPASSRLS; stop for DBA review';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.sync_sessions', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.sync_sessions', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.sync_sessions', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.sync_sessions', 'DELETE')
     OR NOT has_table_privilege('service_role', 'public.sync_participants', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.sync_participants', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.sync_participants', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.sync_participants', 'DELETE') THEN
    RAISE EXCEPTION 'service_role lacks a required Group Sync table privilege';
  END IF;

  SELECT string_agg(format('%I.%I:%I', schemaname, tablename, policyname), ', ')
    INTO unexpected_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('sync_sessions', 'sync_participants')
    AND NOT (
      (tablename = 'sync_sessions' AND policyname = 'sync_sessions_permissive')
      OR
      (tablename = 'sync_participants' AND policyname = 'sync_participants_permissive')
    );

  IF unexpected_policies IS NOT NULL THEN
    RAISE EXCEPTION 'Unexpected Group Sync policies require review: %', unexpected_policies;
  END IF;
END;
$preflight$;

LOCK TABLE public.sync_sessions, public.sync_participants
  IN ACCESS EXCLUSIVE MODE;

ALTER TABLE public.sync_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sync_sessions_permissive"
  ON public.sync_sessions;
DROP POLICY IF EXISTS "sync_participants_permissive"
  ON public.sync_participants;

-- Revoking PUBLIC as well as the two browser roles prevents an inherited
-- table grant from undermining the deny-by-default RLS posture. This does not
-- revoke privileges granted directly to service_role.
REVOKE ALL PRIVILEGES ON TABLE public.sync_sessions
  FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.sync_participants
  FROM PUBLIC, anon, authenticated;

DO $realtime$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sync_sessions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.sync_sessions';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'sync_participants'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.sync_participants';
  END IF;
END;
$realtime$;

DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('sync_sessions', 'sync_participants')
  ) THEN
    RAISE EXCEPTION 'Group Sync policies remain after remediation';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'sync_sessions'
      AND c.relrowsecurity
  ) OR NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'sync_participants'
      AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on both Group Sync tables';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (VALUES ('anon'), ('authenticated')) AS browser_role(role_name)
    CROSS JOIN (
      VALUES ('public.sync_sessions'), ('public.sync_participants')
    ) AS protected_table(table_name)
    CROSS JOIN (
      VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')
    ) AS table_action(privilege_name)
    WHERE has_table_privilege(
      browser_role.role_name,
      protected_table.table_name,
      table_action.privilege_name
    )
  ) THEN
    RAISE EXCEPTION 'A browser role still has a direct Group Sync table privilege';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.sync_sessions', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.sync_sessions', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.sync_sessions', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.sync_sessions', 'DELETE')
     OR NOT has_table_privilege('service_role', 'public.sync_participants', 'SELECT')
     OR NOT has_table_privilege('service_role', 'public.sync_participants', 'INSERT')
     OR NOT has_table_privilege('service_role', 'public.sync_participants', 'UPDATE')
     OR NOT has_table_privilege('service_role', 'public.sync_participants', 'DELETE') THEN
    RAISE EXCEPTION 'service_role access was unexpectedly removed';
  END IF;
END;
$verify$;

COMMIT;
