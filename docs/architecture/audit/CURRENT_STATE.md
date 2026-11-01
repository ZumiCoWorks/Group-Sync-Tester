# Continuum codebase audit — current state

Audit date: 2026-10-22. Repository: /Users/zumiww/Documents/AFDAWS Rebuild. This is a static source/configuration review; no migrations, builds, deployments, live Supabase queries, or Azure changes were made. Existing working-tree changes were preserved.

## Executive finding

Continuum is mixed-maturity, not a finished unified product. The root / is an operational Next.js console that signs in with Supabase, calls the canonical Express API, and aggregates Schedule, Group Sync, and WorkSuite records. Workspace setup, access-grant and record-link flows exist in the API. Other presentation routes are fixtures, not operational academic services. Existing apps remain independent entry points. APIs do not yet share a consistent authorization boundary: Group Sync host operations are unauthenticated.

**P0 — contain immediately:** populated private credentials are present in tracked server/.env.production and server/.env.vercel. Values are intentionally omitted. Treat them as exposed, rotate/revoke through authorized secret owners, remove from tracking/history through the incident process, and inspect deployment usage. This audit changed neither file.

**P0 — authorization/data exposure:** server/src/routes/group-sync.ts has no authentication middleware. A six-character session code is sufficient to read session details/roster and call management endpoints including grouping, ending, roster upload, reset, and demo population. The router uses the service-role Supabase client (server/src/index.ts:33-46); migration policies are permissive (server/migrations/004_group_sync.sql:37-43).

## Inventory and maturity

| Component | Observed role / maturity | Evidence |
|---|---|---|
| apps/continuum | Operational shell/API client; env-configured Supabase sign-in fails closed if missing. /presentation redirects to /; deck and fixtures are demos. | apps/continuum/src/app/page.tsx:80-120,383-394; lib/supabase.ts:1-10; app/presentation/page.tsx |
| apps/group-sync | Independent Next.js grouping/session client; hard-coded Supabase project fallback; server host endpoints unauthenticated. | apps/group-sync/src/utils/supabase.ts:1-12; server/src/routes/group-sync.ts |
| apps/slot-booking | Independent Schedule app; backend routes protect internal staff access; browser client may be null, hidden behind unsafe type cast. | apps/slot-booking/src/utils/supabase.ts:1-10; server/src/routes/batches.ts |
| apps/student-public | Separate student-facing booking application. | apps/student-public/; apps/student-public/vercel.json |
| apps/venue-booking | WorkSuite/venue app; creates client with placeholder values when env missing. | apps/venue-booking/src/utils/supabase.ts:1-16; server/src/routes/worksuite.ts |
| app | Legacy Next app remains a workspace; root dev starts it with the API. | root package.json |
| server | Canonical Express API per docs; service-role Supabase client, Supabase Auth token validation, role_v2 lookup and mounted app routers. | server/src/index.ts:33-46,150-169; server/src/middleware.ts:18-109 |
| backend, server/backend | Legacy copies/configs; actual production traffic/project bindings not verified. | docs/continuum/architecture.md:23-29; directory/deploy configs |
| shared packages | Shared TypeScript types and Continuum UI package; types are not authorization enforcement. | shared/; packages/continuum-ui/ |
| Data/auth/deploy | Supabase Auth/Postgres; migrations duplicated among server/migrations, backend/migrations, supabase/migrations and supabase/supabase/migrations. App/server Vercel configs exist, actual deployed configuration unknown. | migration trees; apps/*/vercel.json; server/vercel.json; backend/vercel.json |

## Verified paths

- Continuum signs in through Supabase, sends the access token to overview, API validates with auth.getUser and resolves users.role_v2 (apps/continuum/src/app/page.tsx:114-120,390-394; server/src/middleware.ts:43-99).
- /api/continuum applies verifyToken and staff-role gate (server/src/routes/continuum.ts:8-10). Overview filters rows by grants and explicit links (52-67,119-151,164-220); workspace setup is admin-only (236-239).
- Schedule internal routes require token/staff role; public batch/slot routes are status-gated, and public roster uses a separate token (server/src/routes/batches.ts:82-100,128-167,193-219,241-295,373+).
- WorkSuite request creation/listing require auth; approvals/import require ops/admin (server/src/routes/worksuite.ts:9,50,74,138,172,203,231).
- Group Sync joins and host management use session codes without authenticated host identity; GET session selects * including roster (server/src/routes/group-sync.ts:35-86,92-125,134+,217-310,316-354,360-413,419-457,463+).

## Authorization, data and maturity

verifyToken rejects invalid tokens, absent user records and missing role_v2, but adhoc with null access_expires_at is allowed (server/src/middleware.ts:71-90). Continuum capability grants check revocation, starts/expiry, workspace, optional service and capability (server/src/services/continuum-access.ts:12-41); admin bypass is explicit.

The API uses a service-role client, which bypasses RLS; route authorization and row scoping are therefore operative controls. Group Sync RLS is permissive. Continuum tables enable RLS, but live grants/policies and applied migrations were not checked. Migration 006 has broad users_select_all (server/migrations/006_phase2_security_rbac.sql:31-33); effective deployed exposure depends on actual grants/schema.

No operational rubric authoring, mark entry, consolidation, or CARS integration was found. Assessment/rubric examples in apps/continuum/src/lib/presentation-data.ts and presentation deck are demo fixtures. Excel parser handles Group Sync rosters, not marks. CARS remains authoritative; manual external entry is the only supported boundary stated in the brief.

## Unknowns / source limitations

The six named DOCX files (01_PRD_Continuum.docx through 06_Implementation_Plan_Continuum.docx) were not found in repo or searched Documents/Desktop/Downloads. Specific document requirements therefore cannot be attributed or compared. Remote Supabase schema/policies, Vercel production traffic/settings, backup/retention, Azure governance, and institutional approvals are unknown.
