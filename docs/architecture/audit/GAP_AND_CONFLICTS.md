# Gaps, conflicts, and evidenced risks

## P0 — contain now

1. **Tracked credentials.** server/.env.production and server/.env.vercel are tracked and contain populated private credential/token variables, including a Supabase service-role credential. Values are omitted. Treat as exposed: rotate/revoke, identify consumers, inspect access/logs, and remove from tracking/history using the incident process. Preserve authorized recovery information; do not casually delete operational files.
2. **Group Sync authorization/data exposure.** server/src/routes/group-sync.ts lacks verifyToken. A six-character Math.random code is sufficient for session GET (select *) and host mutations: group, end, upload, reset, populate (lines 20-28, 92-111, 217-310, 316-354, 360-413, 419-457, 463+). server/migrations/004_group_sync.sql:37-43 defines FOR ALL USING(true) policies. This is an evidenced authorization bypass and potential student-data exposure; confirm deployed exposure and contain.

## P1 — safe identity/data ownership blockers

- Entry authorization is asymmetric: Continuum router-wide auth; Schedule staff middleware; WorkSuite role checks; Group Sync code-only management.
- server/src/index.ts:33-46 uses service-role credentials, bypassing RLS. Handlers must implement every object-level check. Continuum overview manually filters links/workspaces (server/src/routes/continuum.ts:135-151), but integration tests must prove cross-scope denial.
- server/src/middleware.ts:81-90 permits adhoc users with null expiry. Decide whether null means permanent or invalid.
- Supabase client configuration differs: Continuum env-only; Group Sync hard-coded project fallback; Slot Booking nullable client cast; Venue Booking placeholder fallback. This risks cross-environment data access and unclear setup failure.
- Migration authority is unclear across server/migrations, backend/migrations, supabase/migrations and supabase/supabase/migrations. Docs call server canonical, but no deployed project/traffic verified. Confirm one migration/deployment authority before changes.
- Group Sync RLS is permissive; users_select_all is broad in migration 006. Effective remote access is unknown; verify live policies/grants with authorized operators.
- Auth token requires public.users role_v2 record; onboarding/offboarding/role synchronization contract is not evidenced.

## P2 — MVP gaps

- No operational rubric template/versioning, assignment matching, marking, import, consolidation, validation, or CARS export pipeline found; Continuum assessment data is fictional.
- Continuum service catalog/links do not establish complete workflows for every source application.
- No demonstrated end-to-end test proves permission parity across direct app and Continuum entry.
- Azure tenancy/Entra/hosting approval, backup/retention/cost/support ownership, and CARS interface contract are unknown.

## P3 — maintainability

- Normalize fail-fast environment validation and remove placeholder fallbacks.
- Document owner, maturity, data contract and public fields for each app.
- Add CI checks for divergent/duplicate migration trees.
- Mark fixture screens visibly as demo and test source-unavailable states.

## Limitations

The six requested DOCX documents were unavailable; conflicts against their sections are unknown, not absent. Remote Supabase/Vercel/Azure state was not queried. This is static review, not a penetration test or proof of exploitation.
