# Continuum functional vertical slice

## Outcome

Continuum now has an operational route at `/` in addition to the fictional conference prototype at `/presentation`.

The operational route uses the existing Supabase identity and canonical `server/` API. It does not create or infer a BCom workspace mapping.

## Implemented data flow

1. The user signs in through the existing Supabase tenant.
2. The browser sends the Supabase bearer token to `GET /api/continuum/overview`.
3. The canonical server verifies the token and `users.role_v2`.
4. The server reads current records from:
   - `batches`, owned by Schedule;
   - `sync_sessions` and `sync_participants`, owned by Group Sync;
   - the signed-in user's `venue_booking_requests`, owned by WorkSuite.
5. Continuum displays source availability and records without copying ownership.
6. Creating a Group Sync session calls `POST /api/continuum/group-sync/sessions`, writes to `sync_sessions`, and appends an event to the existing `audit_logs` table.

## Roles

The operational API accepts the current canonical staff roles:

- `tutor_junior`
- `tutor_senior`
- `lecturer`
- `adhoc`
- `ops_venue_admin`
- `admin`

Students retain their existing anonymous or service-specific touchpoints and do not receive this operational overview.

## Ownership boundaries

- Schedule remains responsible for editing, publishing, booking and attendance.
- Group Sync remains responsible for participant joining and group generation.
- WorkSuite remains responsible for venue requests and approvals.
- CARS remains outside this slice.
- Continuum authenticates, aggregates and provides governed handoffs.

## Orchestration mapping

Migration 008 has been verified on the resumed Supabase project. The database also contains the earlier institution, period, workspace, service, activity and service-handoff tables from `supabase/migrations/20260910110000_continuum_platform.sql`. The revised additive `009_continuum_orchestration.sql` extends that schema with source-record links, workflow input/result lineage, scoped access grants and additional setup metadata without altering protected source tables.

Until migration 009 is applied, the operational interface continues to label records as institution-wide and does not infer a BCom relationship.

## Environment

Copy the placeholder names from `apps/continuum/.env.example` into the deployment environment. Never commit tenant credentials.

## Current deployment readiness

The Supabase project was resumed and the canonical deployed backend returned HTTP 200 from `/api/ready` with `database: ok` on 28 September 2026. Migrations 001 and 003–008 were verified through read-only schema probes.

Migration 009 must be applied before deploying the new workspace-setup and traced-workflow API. Follow `docs/continuum/migration-009-runbook.md`, deploy the backend, then deploy Continuum and test with a fictional admin account.

Secrets must remain in the relevant deployment settings and must not be pasted into documentation, source control or chat. Existing tracked generated environment files still require owner-led removal and key rotation.
