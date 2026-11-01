# Continuum verification plan

No tests were executed and no database was mutated during this static audit. Run only in non-production after credential rotation and owner approval.

## Gate 0 — containment

- Rotate/revoke private credentials in tracked env files and active deployment copies; verify old values fail without printing them.
- Follow incident procedure for logs, repository history, caches and deployment artifacts.
- Confirm production builds fail closed without required env and private service-role credentials never appear in browser bundles.

## Gate 1 — identity and parity

- Valid token maps to correct immutable user and role_v2; malformed, expired, revoked, missing-user/role tokens deny.
- Test adhoc expiry null/future/exact-boundary/expired; decide null policy.
- For each role, compare direct app and Continuum access to same records/actions; test URL/context tampering, cross-user/workspace denial.
- Test grants for user/workspace/service/capability, start, expiry, revoke and admin behavior.

## Gate 2 — Group Sync

- Anonymous users can only perform approved join/read actions; cannot create host sessions or group/upload/reset/end/populate.
- Verify authenticated host ownership for every mutation; guessed/replayed/expired code, cross-session IDs and rate abuse fail.
- Ensure roster projections minimize student IDs, placement, names, uploaded files, errors and logs by role.
- Test malformed workbook, duplicate rows, size/type limits, empty roster, concurrent join/group/reset/end, retention/deletion, and audit events.
- Test access through both service API and anon Supabase client against RLS.

## Gate 3 — Schedule and WorkSuite

- Test draft/published/closed visibility, batch create/update/publish/close, bookings, cancellations, roster-token access and rotation.
- Swap IDs across users/departments/venues; ensure only approved owners/roles succeed.
- Verify WorkSuite requester sees only own requests; ops/admin approval/import audited; other roles denied.
- Check public response fields and status filters.

## Gate 4 — database/deployment

- In disposable staging, test anon/authenticated/service-role access separately for every table/policy; verify users and Group Sync privacy.
- Compare live schema/history with one canonical migration chain; CI rejects divergent copies and risky unreviewed changes.
- Verify each app targets intended project; missing/placeholder env fails clearly; inspect built assets for private credentials without printing matched values.
- Exercise backup restore, audit retention, rollback and incident recovery.

## Gate 5 — Continuum and rubric boundaries

- Overview distinguishes empty from unavailable; only explicitly linked records appear within workspace scope; no cross-workspace grants/users/links leak.
- Validate admin-only setup, references, duplicates, revoked access and source failure.
- Demo routes cannot write production academic records and clearly identify fixtures. Confirm no live rubric/CARS workflow is implied.
- After academic/CARS approval, test versioned templates; authorized matching/exceptions; individual, group-shared, group-individual and panel marking; import idempotency; validation; review; audit; and a CARS-owner-approved manual export sample.

## Gate 6 — operational quality and exit

- Accessibility, keyboard/screen reader, responsive layouts, timezone correctness, source/error states.
- Load/abuse tests for code endpoints and uploads; monitor latency, PII in logs, alerts, support, retention and cost.
- Exit only with no P0s, passing parity/cross-scope tests, verified live RLS/grants and canonical migrations, completed rotations, and named operational sign-off. Azure and rubric decisions remain separate.
