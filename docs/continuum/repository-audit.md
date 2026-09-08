# AFDA Continuum POC — Repository Audit

Audit date: 7 September 2026
Branch: `feature/afda-continuum-poc`

## Executive finding

The repository is a functioning but fragmented AFDA operations POC. It is a npm workspace containing five Next.js applications, a canonical Express/Supabase backend, a legacy backend copy, shared TypeScript utilities, PostgreSQL migrations, Vercel configuration and a small test suite. It is not currently an LMS.

Continuum should be added as an umbrella application and provider-neutral domain layer. Existing Schedule, Student Booking, Group Sync and WorkSuite code should remain independently deployable while Continuum consumes their current APIs and relates their records through additive mapping tables.

## Workspace and application inventory

| Path | Framework | Responsibility | Status |
| --- | --- | --- | --- |
| `apps/continuum` | To be created as Next.js App Router | Continuum shell and POC journey | New work |
| `apps/slot-booking` | Next.js App Router | Staff Schedule: batches, slots, attendance, imports and exports | Active |
| `apps/student-public` | Next.js App Router | Student Schedule: discovery, booking, confirmation and cancellation | Active |
| `apps/group-sync` | Next.js App Router | Session-based interdisciplinary grouping and spreadsheet roster ingestion | Active |
| `apps/venue-booking` | Next.js App Router | Venue requests, approvals and timetable imports | Active; contains uncommitted user work |
| `app` | Next.js App Router | Older combined student/staff booking UI | Legacy compatibility application |
| `server` | Express, TypeScript, Supabase | Canonical API selected by the root workspace | Active |
| `backend` | Express, TypeScript, Supabase | Diverged backend copy referenced by older documentation/CI | Legacy/ambiguous |
| `shared` | TypeScript package | Booking-era types, constants and utilities | Active but stale role model |

All existing frontends use React 18 and installed Next.js 16 package declarations. **Next.js 16 is the application baseline for Continuum.** Earlier planning documents describing Next.js 14 are stale and must not drive scaffolding decisions. Some Tailwind and ESLint packages/configuration still reflect the older setup, which explains configuration warnings.

## Canonical backend decision

`server/` is canonical for Continuum because:

- It is the `@afda/backend` package selected by the root npm workspace.
- Root `dev`, `build`, `lint` and `type-check` commands resolve that workspace.
- It contains the newest role model, WorkSuite routes and migrations 006–008.
- Its Vercel project is linked to `afda-core-backend`.

`backend/` remains a compatibility copy and must not receive new Continuum work. It is still referenced by README/deployment material and the GitHub workflow, so removal or consolidation must be a later, explicit migration. The nested `server/backend/` copy also causes Jest to discover duplicate package names and tests.

## Authentication and authorisation

- The canonical `server/src/middleware.ts` validates bearer tokens through Supabase Auth, then reads `users.role_v2` and `access_expires_at`.
- Current canonical roles are `student`, `tutor_junior`, `tutor_senior`, `lecturer`, `adhoc`, `ops_venue_admin` and `admin`.
- `shared/types.ts` and `shared/constants.ts` still describe the older `staff`, `ops` and `integrator` roles.
- Slot Booking and Venue Booking use browser Supabase clients for sign-in. Group Sync has a separate browser client and currently embeds a fallback public project URL/anon key. Student Public is intentionally anonymous for booking operations.
- Existing authorisation is largely broad-role based. Continuum requires venture- and assessment-scoped capabilities in addition to these baseline roles.
- Current adhoc expiry is global (`users.access_expires_at`); Continuum requires additive scoped grants per venture and optional assessment.

## Supabase and environment expectations

The applications expect one Supabase project and one Express API. Production URLs are inconsistent: source defaults reference both `afda-api.vercel.app` and `afda-core-backend.vercel.app`. Environment variables should be authoritative; source defaults are compatibility fallbacks only.

Real-looking Vercel-generated environment files are tracked in Git under `server/`. Hard-coded project URLs and a Group Sync browser Supabase fallback are also present. These are active security/configuration risks. Generated environment names are now ignored for future files, but already tracked files remain tracked. Their removal, credential rotation and any Git-history remediation require an owner-led security operation. Continuum does not print, copy, import or reproduce those values and provides placeholder-only examples.

## Database and migrations

Canonical migration order is:

1. `001_initial_schema.sql` — users, venues, batches, slots, bookings, venue requests, audit/import/notification tables and initial RLS.
2. `003_venue_booking.sql` — safe incremental venue additions and batch public token.
3. `004_group_sync.sql` — `sync_sessions` and `sync_participants`.
4. `005_batch_day_times.sql` — persisted batch-day scheduling fields.
5. `006_phase2_security_rbac.sql` — `role_v2`, access expiry and revised policies.
6. `007_venue_booking_poc.sql` — departments, visibility, direct venue time ranges, overlap constraint and webhook configuration.
7. `008_venue_buildings_and_importer.sql` — currently uncommitted; buildings and import-source tracking. Its repository status and intended deployment order must be resolved before any migration 009 is created.

The `backend/migrations` directory stops at migration 005 and includes a non-versioned combined setup script. Foundation Phase 1 creates or applies no migration. Any later Continuum migration belongs only in `server/migrations`, after migration 008 is intentionally resolved, and must not edit an earlier migration.

Protected contracts:

- `batches`, `slots`, `sync_sessions` and `sync_participants` are consumed by existing applications and will not be altered.
- Continuum will use mapping tables with foreign keys to those records.
- Existing `users`, `venues`, `venue_booking_requests`, `audit_logs` and `notifications` will be reused rather than recreated.

## Workflow ownership and safe API consumption

| Workflow | Owner | Canonical API | Continuum treatment |
| --- | --- | --- | --- |
| Staff scheduling | `slot-booking` | `/api/batches`, `/api/bookings`, `/api/imports`, `/api/exports` | Preserve and deep-link; map batches to ventures |
| Student booking | `student-public` | Public batch/slot/booking endpoints | Preserve as the student Schedule experience |
| Group formation | `group-sync` | `/api/group-sync` | Preserve; map completed sessions to ventures |
| Original batch venue approval | `venue-booking` | `/api/venues` | Compatibility workflow only |
| Department/resource request POC | `venue-booking` | `/api/worksuite` | Canonical WorkSuite workflow for Continuum |
| Audit history | Server | `/api/audit-logs` | Preserve; add Continuum-specific audit events without rewriting history |

`/api/venues` and `/api/worksuite` model different request shapes. Continuum will label `/api/worksuite` as the canonical Spaces & Resources experience while retaining `/api/venues` for batch-linked compatibility.

### Migration 007 overlap behaviour

Migration 007 creates a GiST exclusion constraint on `venue_id` and the generated `booking_range`, but its predicate is `WHERE (status = 'approved')`. Therefore:

- Pending requests may overlap one another.
- Pending requests may overlap an already approved request while they remain pending.
- Only approved requests are protected from overlapping another approved request.
- When two competing pending requests are approved, the first successful transaction obtains the approved range. The second update violates PostgreSQL error `23P01`; the current WorkSuite route translates that failure to HTTP 409 and leaves the competing request unapproved.

The constraint is unchanged in Foundation Phase 1.

## Audit history reuse decision

The existing `audit_logs` table already provides `user_id`, action, resource type/id, JSON details/changes, request metadata and an immutable timestamp. Current application code writes through the insert-only `logAuditEvent` helper, and the exposed audit API only reads/exports records. This is sufficient to represent append-only Continuum events by adding new action/resource conventions later; a duplicate `audit_events` table is not justified.

The database does not currently enforce append-only behaviour against the service role, and the helper does not provide hash chaining or retention controls. The current uncommitted WorkSuite calls also use a parameter order inconsistent with the helper signature and require owner review. Phase 1 therefore uses fictional activity fixtures only. A later security-reviewed phase should add server-only insertion rules and prohibit update/delete for application roles without replacing the table.

## Existing components and design

- Group Sync contains the strongest component library: Radix-backed button, input, select, dialog, alert, card, toast and dropdown components.
- Slot Booking, Student Public and Group Sync share partial light-theme variables, including provisional red and blue accents.
- Venue Booking and the legacy app use unrelated dark gradient/glass treatments.
- No official AFDA logo package or brand-guideline file was found. Group Sync contains only an app icon.
- At audit time Impeccable was not installed. It is now configured for the Continuum child app with code-first workflow defaults, durable `PRODUCT.md` and `DESIGN.md` context, a machine-readable design sidecar and an active design-review hook.

Continuum introduces a small shared package with semantic tokens and accessible operational components. Exact colours are explicitly provisional pending official AFDA brand assets. The lockup is text only and does not claim to be an official AFDA logo.

## Baseline verification

Before Continuum source changes:

- Root TypeScript check: passed across all configured workspaces.
- Root production build: failed in the legacy `app` because the local Next.js SWC binary/fallback could not load; it also reports obsolete `swcMinify` configuration.
- Canonical backend tests: 2 suites passed and 2 failed. Failures are a middleware mock/circular-import issue in `bookings.test.ts` and a stale expected parser summary missing `withPerformance`.
- Jest also discovers `server/backend`, demonstrating the duplicate-backend configuration problem.
- Live deployment status was not verified; external access was not authorised during the audit.

These are baseline issues, not Continuum regressions.

## Existing uncommitted work

The branch was created without stashing or rewriting the working tree. Existing uncommitted changes include WorkSuite API/UI work, the master timetable importer, `my-requests`, auth middleware changes, package updates, generated TypeScript build files and local diagnostic scripts. Continuum files will be kept separate and overlapping edits will be minimal.

## Audit answers

1. Canonical backend: `server/`.
2. Duplicate references: README, deployment docs, CI, root TypeScript include, and nested test discovery still reference `backend/`.
3. Applications: Next.js App Router; backend: Express/TypeScript.
4. Authentication: shared Supabase tenant in intent, inconsistent client setup in implementation.
5. Schema: one shared Supabase PostgreSQL schema.
6. Roles/departments: canonical source is `public.users.role_v2` plus `public.users.department`.
7. Venue state: migrations 003, 007 and uncommitted 008 are required for the newest WorkSuite POC.
8. Workflow owners: listed above.
9. Safe consumption: existing read APIs plus additive mapping foreign keys.
10. Reusable components: Group Sync primitives and shared light-theme tokens.
11. Baseline status: type-check green; builds/tests not fully green.
12. Existing work: preserved verbatim on the new branch.

## Accepted Foundation Phase 1 corrections

- Registry is not added to `role_v2`. Fictional Registry-capable staff use an existing authorised baseline role plus proposed `registry_review` and `export_authority` scoped capabilities.
- Student Public keeps anonymous booking discovery/claim behaviour. No anonymous path is proposed for Ventures, assessment, results, capability or integration data.
- Continuum Phase 1 is fixture-only: no persistent academic schema, Supabase write path or migration 009.
