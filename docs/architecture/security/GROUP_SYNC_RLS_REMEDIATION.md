# Group Sync RLS Remediation — DBA Review Package

**Status:** DRAFT — DO NOT APPLY

**Prepared:** 1 November 2026

**Scope:** `public.sync_sessions` and `public.sync_participants`

## Proposed decision

Deny `anon` and `authenticated` all direct table access. The canonical `server/` backend, using its server-only `service_role` credential, is the sole database path. Public discovery and join, participant reads, authenticated host actions, and Continuum orchestration remain API operations with explicit projections and authorization.

The proposed SQL is [`sql/DRAFT_010_group_sync_deny_direct_access.sql`](sql/DRAFT_010_group_sync_deny_direct_access.sql). It is intentionally stored under `docs/`, not any migration directory, and must not be executed until every gate in this document is satisfied.

## Repository evidence

- `server/migrations/004_group_sync.sql` enables RLS but creates `FOR ALL USING (true) WITH CHECK (true)` policies on both Group Sync tables.
- The same permissive policies appear in `backend/migrations/004_group_sync.sql` and `backend/migrations/000_safe_full_setup.sql`.
- The current local Group Sync frontend no longer reads, writes, or subscribes to these tables directly. It uses the canonical API for state and mutations.
- `server/src/routes/group-sync.ts` and `server/src/routes/continuum.ts` access the tables through the server-only Supabase client.
- The legacy `backend/src/routes/group-sync.ts` remains materially different and must be proven non-routable before rollout.
- `server/scripts/migrate.js` runs only `001_initial_schema.sql`; it is not an ordered runner for the numbered migration set and must not be used to apply this change.
- Five migration trees/divergent histories remain an RB-006 blocker. Repository naming alone cannot establish production migration authority.

## What the draft changes

The draft transaction:

1. stops if either table, expected Supabase role, service-role privilege, or service-role RLS bypass is missing;
2. stops if it finds any policy other than the two known permissive policies;
3. locks both tables for the short policy/grant change;
4. keeps RLS enabled and removes the permissive policies;
5. revokes table privileges from `PUBLIC`, `anon`, and `authenticated` without changing direct `service_role` grants;
6. removes both tables from `supabase_realtime`; and
7. verifies the intended deny-by-default state before commit.

It does not alter rows, columns, constraints, indexes, functions, credentials, or application configuration. It deliberately does not enable `FORCE ROW LEVEL SECURITY`; DBA review is required before changing table-owner behavior.

## Read-only preflight

Run these in the approved database console and save redacted output with the environment/change record. Do not paste tokens or connection strings into tickets, chat, or shell history.

```sql
select current_database(), current_user, now();

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('sync_sessions', 'sync_participants')
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('sync_sessions', 'sync_participants')
order by table_name, grantee, privilege_type;

select pubname, schemaname, tablename
from pg_publication_tables
where schemaname = 'public'
  and tablename in ('sync_sessions', 'sync_participants')
order by pubname, tablename;

select rolname, rolsuper, rolbypassrls
from pg_roles
where rolname in ('anon', 'authenticated', 'service_role')
order by rolname;
```

The DBA must also correlate the target environment with the active Vercel project, API alias, deployed commit, Supabase project reference, and recorded migration history. If any value is ambiguous, stop.

## Required release order

1. Confirm `server/` is the only active backend and record the last-known-good deployment.
2. Review and commit the API-only code and denial-path tests.
3. Deploy that exact commit to a non-production environment using synthetic data.
4. Run the API and browser acceptance suite before any RLS change.
5. Confirm backup/PITR coverage and name the person authorized to restore.
6. Have the DBA adapt the draft into the approved canonical migration mechanism.
7. Apply it to non-production and execute [`GROUP_SYNC_RLS_TEST_MATRIX.md`](GROUP_SYNC_RLS_TEST_MATRIX.md).
8. Record evidence and obtain Security, DBA, DevOps, Group Sync owner, and Privacy sign-off.
9. Schedule production as a separate change with monitoring and a rollback owner.

## Rollback rules

This migration changes access controls, not data, so the preferred response to a failed check is `ROLLBACK` before the transaction commits.

After commit, do not restore `USING (true)` policies as a routine rollback. That would re-open the original vulnerability. Keep direct browser access denied, roll forward the API/client fix, or roll back to another API-only application release. If an emergency business decision requires temporary direct access, Security and the DBA must approve a narrowly scoped, time-bounded policy in a separate incident change.

Removing the tables from Realtime is reversible, but re-adding them does not restore direct authorization and should happen only if a reviewed client design needs Realtime again.

## Monitoring and stop conditions

Monitor Group Sync API `401`, `403`, `404`, and `5xx` rates; join failures; host mutation failures; Continuum orchestration failures; and database permission errors. Logs must not contain bearer tokens, participant capability headers, roster payloads, or uploaded workbook contents.

Stop or roll back the transaction if an unexpected policy/grant exists, the service role lacks required access, the target environment cannot be proven, the legacy backend is routable, or API-only acceptance tests fail. Escalate after commit if normal backend requests receive database permission errors or any direct browser-role operation succeeds.

## Required approvals

| Owner | Decision required | Evidence |
|---|---|---|
| Security | Direct browser denial and API boundary approved | Signed matrix/results |
| DBA | Target, canonical migration path, lock impact, backup and rollback approved | Change record |
| DevOps | Active backend/root/commit and release order confirmed | Deployment record |
| Group Sync owner | Public, participant, and host workflows accepted | Acceptance report |
| Privacy/data owner | Returned fields, logging, and synthetic test data approved | Review note |
