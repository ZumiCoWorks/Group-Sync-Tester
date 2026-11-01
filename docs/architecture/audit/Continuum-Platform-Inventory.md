# Continuum Platform Inventory

**Status:** Repository reconciliation artifact
**Scope:** AFDA Continuum repository only
**Evidence date:** 29 October 2026

This inventory separates repository evidence from test, deployment and operational evidence. It does not establish production traffic or live database state.

## Repository boundary

Repository root: `/Users/zumiww/Documents/AFDAWS Rebuild`.

In scope: `app`, `apps/*`, `server`, `backend`, `server/backend`, `shared`, `packages`, `api`, `supabase`, `tests`, `docs`, package manifests, migration files and deployment configuration.

Excluded from application inventory: `Logos`, CSV fixtures, `playwright-report`, `test-results`, `fix_*.js`, `patch_*.js` and other diagnostic/generated artifacts unless explicitly cited as evidence. No neighboring project root was identified.

## Application map

| Application | Entry point | Technology | Data/API evidence | Auth/authz evidence | Tests | Maturity |
|---|---|---|---|---|---|---|
| Continuum | `apps/continuum/src/app/page.tsx`; `server/src/routes/continuum.ts` | Next.js App Router, React, Supabase client | Workspace, services, links, workflow and grants through `/api/continuum` | Supabase session plus bearer token, role gate and Continuum access grants | Continuum access tests exist; no live parity evidence | Partially implemented; not validated |
| Group Sync | `apps/group-sync/src/app/page.tsx`; `apps/group-sync/src/app/room/[sessionId]/client-page.tsx` | Next.js, Supabase browser client | `/api/group-sync`; `sync_sessions`, `sync_participants`; XLSX roster parser | Browser join flow; backend Group Sync router has no visible auth wrapper | Grouping/parser tests; no route authorization suite | Implemented; security mismatch |
| Schedule / Slot Booking | `apps/slot-booking/src/app`; `server/src/routes/batches.ts`, `bookings.ts`, `imports.ts`, `exports.ts` | Next.js, Express, Supabase, XLSX/PDF tooling | Batches, slots, bookings, imports and PDF/XLSX/CSV booking exports | Bearer token and role middleware on internal mutations/reads; public batch, slot, booking and roster-token flows also exist | Booking tests and staff E2E mocks | Implemented; needs validation |
| Student Booking | `apps/student-public/src/app`; public server routes | Next.js, anonymous/public booking flow | Public batches, slots and bookings | Intentionally public workflow; exact token and scope behavior needs verification | Import/staff E2E is not proof of student security | Implemented; needs validation |
| Spaces / WorkSuite | `apps/venue-booking/src/app`; `server/src/routes/worksuite.ts` | Next.js, Express, Supabase | Venues, requests, approvals, imports | Authenticated requester routes; operations/admin approval routes | No complete authorization/state suite | Partially implemented |
| Legacy combined app | `app/src/app`; `app/package.json` | Next.js App Router | Older booking API usage | Local token handling and legacy assumptions | Legacy build baseline has known issues | Legacy/compatibility |
| Academic configuration | Continuum screens and fixtures | Next.js UI/prototype | No authoritative academic schema established | Prototype role/context display only | No acceptance tests | Prototype |
| Assessment/rubric | Continuum presentation data and screens | Fixture/demo UI | No confirmed operational assessment tables or routes | No operational assessment authorization | No operational assessment tests | Proposed/demo |
| CARS | External system | Not in repository | No direct connector established | External ownership | None | External dependency |
| Microsoft 365 / Entra | No verified connector | Unknown | Documentation only | Institutional decision required | None | Dependent/unknown |

### User-facing route inventory

| App | Routes found |
|---|---|
| Root/legacy Schedule | `/`, `/staff`, `/staff/editor/new`, `/staff/editor/[batchId]`, `/batch/[batchId]`, `/batch/[batchId]/confirm` |
| Continuum | `/`, `/activities/[activityId]`, `/presentation` (redirect/demo), `/presentation/deck` (demo) |
| Group Sync | `/`, `/join`, `/room/[sessionId]` |
| Staff Schedule | `/`, `/editor/new`, `/editor/[batchId]`, `/editor/[batchId]/bookings` |
| Student Booking | `/`, `/batch/[batchId]`, `/batch/[batchId]/confirm`, `/batch/[batchId]/roster`, `/batch/[batchId]/student-roster`, `/my-booking` |
| WorkSuite | `/`, `/worksuite/registry/request`, `/worksuite/registry/my-requests`, `/worksuite/ops/approvals`, `/worksuite/ops/importer` |

`apps/admin-hub/` is present as a directory but no application files or package manifest were found; it is not counted as an operational application.

## Backend candidates

| Candidate | Evidence | Reconciliation status |
|---|---|---|
| `server/` | Root workspace includes `server`; contains newer role model, WorkSuite and Continuum routes; [server/package.json](../../../server/package.json) | Candidate canonical backend, not production-verified |
| `backend/` | Older route/migration tree, separate package and Vercel config | Compatibility/legacy candidate; still referenced by docs/config |
| `server/backend/` | Nested duplicate backend source, package and migrations | Duplicate; contributes to test/dependency ambiguity |
| `api/vercel.ts` | Root handler imports compiled server output | Deployment candidate; active traffic unknown |

## Shared packages and utilities

- `shared/`: shared TypeScript types, constants and utilities. Its role vocabulary is older than the canonical `server` `role_v2` model.
- `packages/continuum-ui/`: shared Continuum UI package.
- `server/src/services/`: grouping, XLSX parsing, Continuum access and related services.
- `api/`: Vercel API entrypoint candidate.

Shared types do not prove shared authorization. Each protected backend route remains responsible for authorization.

## Authentication and authorization surfaces

- Supabase Auth bearer validation: `server/src/middleware.ts` and `backend/src/middleware.ts`.
- User role resolution: `public.users.role_v2` and `access_expires_at`.
- Continuum router-wide protection: `server/src/routes/continuum.ts`.
- Role-gated domain routes: batches, bookings, imports, exports, venues and WorkSuite.
- Group Sync route protection: not present at the router boundary in `server/src/routes/group-sync.ts` or `backend/src/routes/group-sync.ts`.
- Privileged database client: initialized from `SUPABASE_SERVICE_ROLE_KEY` in backend entrypoints.

The current identity path is Supabase access token -> `auth.getUser` -> `public.users` lookup -> `role_v2`/`access_expires_at`. Continuum adds workspace/service/capability grants through `server/src/services/continuum-access.ts`. This is not yet a single platform policy: Schedule uses broad role arrays, WorkSuite combines user filtering with ops/admin roles, and Group Sync uses the session code without an authenticated host identity.

### API route families

| Prefix | Principal operations | Protection observed |
|---|---|---|
| `/api/auth` | Token verification | Token supplied to verification handler |
| `/api/batches` | List/detail/slots/public roster; create/update/publish/close | Public/status/token reads plus staff-role mutations |
| `/api/bookings` | Create/lookup/cancel; staff list/update/delete | Public booking flows plus staff-role management |
| `/api/imports`, `/api/exports`, `/api/audit-logs` | Booking roster import, booking export, audit read/export | Token and broad staff/ops roles |
| `/api/venues` | Venue/request CRUD and approval | Token and role middleware |
| `/api/worksuite` | Venues, own requests, operational queue, approval, importer | Authenticated requester; ops/admin management |
| `/api/group-sync` | Session create/read/join/group/end/upload/reset/populate | No route authentication; code is the effective locator/authority |
| `/api/continuum` | Overview, workspace/service/grant management, source links and Group Sync orchestration | Router-wide token/staff role; admin/capability checks inside |

The `backend/` route set differs: its Continuum router exposes bootstrap/activity/service endpoints without the newer `server/` grant model, and it does not contain the newer WorkSuite router. This is a functional divergence, not just a duplicated directory name.

## Database and migration inventory

Migration trees found:

- `server/migrations` - Group Sync, RBAC, WorkSuite and Continuum candidates.
- `backend/migrations` - older booking and Group Sync history.
- `server/backend/migrations` - nested duplicate history.
- `supabase/migrations` - Continuum platform migrations.
- `supabase/supabase/migrations` - additional Continuum migration history.

Known schema areas include users, roles, venues, batches, slots, bookings, venue requests, audit logs, notifications, `sync_sessions`, `sync_participants`, Continuum workspaces/services/links/grants and workflow records.

Repository SQL also shows:

- `server/migrations/004_group_sync.sql` enables RLS and then creates `FOR ALL USING (true) WITH CHECK (true)` policies for both Group Sync tables.
- `server/migrations/006_phase2_security_rbac.sql` introduces `role_v2` and access-expiry-related behavior but also includes a broad users select policy.
- `server/migrations/009_continuum_orchestration.sql` adds record links, workflow runs and access grants.
- Supabase timestamped migrations contain an earlier Continuum platform shape. Applied order and compatibility with migration 009 are not known.

The following assessment entities were not confirmed in inspected operational migrations: rubric templates, rubric versions, generation batches, completed-mark imports, mark sources, assessment records, mark exceptions, module reports and CARS export batches.

## Deployment and configuration

Relevant files include:

- Root `package.json` workspace and scripts.
- `apps/*/vercel.json` frontend configurations.
- `backend/vercel.json`.
- `server/vercel.json`.
- `api/vercel.ts`.
- `supabase/config.toml`.
- `docs/DEPLOYMENT.md` and `README.md`.

The root workspace selects `server/` as `@afda/backend`, while `.github/workflows/ci-cd.yml` installs/builds `backend/` and deploys the repository root. `backend/vercel.json`, `server/vercel.json`, and root `api/vercel.ts` use different serverless entry strategies. The root `.vercel` metadata describes a Slot Booking frontend project, not proof of the backend receiving traffic. These facts make the active backend a decision/evidence question.

These files conflict about the backend target. No repository file proves which project receives production traffic.

Environment variable names are documented in example/configuration files. Baseline `HEAD` and the remote-tracking branch contain populated `server/.env.production` and `server/.env.vercel` plus a hard-coded Group Sync browser fallback; values are intentionally omitted. Local checkpoint remediation removes the environment files from the next Git index while preserving ignored local copies, and replaces the browser fallback with required environment configuration. Rotation, deployed consumers and remote-history treatment still require authorized incident handling.

## Test inventory

Observed test surfaces include:

- Backend route tests, including booking tests.
- Continuum access tests.
- Grouping algorithm tests.
- XLSX parser tests.
- Playwright staff/import E2E suites.
- Performance and smoke scripts.

Test files found are `server/src/routes/bookings.test.ts`, `server/src/services/continuum-access.test.ts`, `server/src/services/grouping-algo.test.ts`, `server/src/services/xlsx-parser.test.ts`, legacy booking-test copies, and two Playwright specs under `tests/e2e/tests`.

On 29 October 2026 the backend Jest command was executed. Four suites passed and one failed; 18 tests passed. The current `server/src/routes/bookings.test.ts` suite failed during module loading because its middleware mock does not provide `requireRole`. This result does not validate a deployment, browser flow, authorization boundary or database policy.

No dedicated tests were found for Group Sync host authorization, session-code abuse, direct-entry parity, live RLS denial, credential exposure, migration authority or assessment/CARS behavior.

## Evidence limitations

Repository code establishes implementation presence, not deployment, passing tests or production readiness. Live Vercel metadata, Supabase project identity, applied migration history, policies, grants, traffic and institutional approvals remain unknown.
