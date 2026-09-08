# AFDA Continuum — Data Safety Plan

## Safety objective

Continuum must prove cross-system lineage without rewriting institutional source data. All POC schema changes are additive, all fixtures are visibly fictional, and integrations default to disconnected/demo mode.

## Protected data contracts

The following existing tables are treated as immutable contracts:

- `batches`
- `slots`
- `sync_sessions`
- `sync_participants`

Continuum migrations must not drop, rename, truncate or alter these tables. Foundation Phase 1 creates no mapping table and uses only fictional references. Later relationships are proposed through separate mapping tables after migration 008 is resolved.

Existing `users`, `venues`, `venue_booking_requests`, `audit_logs` and `notifications` are reused. New tables may reference them but will not duplicate their purpose.

## Foundation Phase 1 migration policy

- Create no migration 009 and apply no Supabase migration.
- Do not edit migrations 001–008.
- Resolve the uncommitted status, review and intended deployment order of migration 008 before persistent Continuum schema design begins.

For a later approved phase:

- Add new numbered migrations only under `server/migrations`.
- Use UUID primary keys, foreign keys and explicit check constraints.
- Enable RLS on every new table.
- Grant no anonymous access to academic results or integration data.
- Use fail-closed policies based on `auth.uid()`, baseline role and scoped capability.
- Do not apply migrations automatically to any local or production Supabase project.

Applying the migration requires a separate reviewed deployment step and a verified backup.

## Import safety

- File import first creates an import batch and immutable staged rows.
- Preview and validation occur before confirmation.
- External source IDs and import fingerprints support duplicate detection.
- Re-imports are idempotent or create an explicit new version.
- Unmatched students remain unresolved; they are never silently assigned.
- Removing a mapping does not delete the imported source row.
- Raw payloads are referenced, not copied into audit output or client logs.

## Assessment safety

- Imported results and native evaluations remain distinct source records.
- Evaluation submission, mark finalisation, result release, export certification and export are separate events.
- Scores and weighting calculations are performed on the server/database boundary.
- Finalised or released results cannot be silently edited.
- Any post-export change marks the previous export batch outdated and requires a new batch.
- Every export row retains traceable assessment, source, assessor, finaliser and formula-version identifiers.

In Foundation Phase 1 these are provider-neutral TypeScript contracts and visibly fictional UI states only. No mark is calculated or persisted.

## Access safety

- Supabase Auth validates identity.
- Registry is not a `role_v2` value and is not added in Phase 1. Registry-capable fictional personas use an existing staff/admin baseline plus the proposed `registry_review` and `export_authority` scopes.
- Baseline roles do not substitute for scoped capability checks.
- Adhoc grants contain start and expiry timestamps, scope, capabilities, grantor and reason.
- Expiry is checked on every protected backend operation and represented in RLS helper functions.
- Students may read only their own results/membership data.
- Registry may validate and export but may not change rubric scores.
- Client-supplied role/capability values are never trusted.

## Fixture and privacy policy

- POC fixtures use `DEMO` identifiers and fictional people only.
- No production database is queried to populate fixtures.
- No real student names, email addresses, marks, tenant IDs, tokens or webhook URLs are committed.
- Demo-mode screens display an explicit banner and never imply live Microsoft or CARS connectivity.

## Existing secret exposure risk

Tracked Vercel-generated environment files and a browser Supabase fallback were discovered during audit. Continuum will not reproduce these values. Before a pilot, AFDA should rotate affected credentials, remove generated environment files from Git history where appropriate, remove browser fallbacks, and enable secret scanning.

New ignore rules prevent future `.env.production`, `.env.vercel`, `.env.*.local` and `.vercel/` artifacts from being added accidentally. Git ignore rules do not untrack the existing `server/.env.production` or `server/.env.vercel`; only the repository owner should resolve those files and rotate associated credentials.

## Audit history decision

Reuse `audit_logs` rather than create a second audit architecture. Its schema can carry Continuum action/resource conventions and JSON lineage, its write helper is insert-only, and the public route is read/export only. Before persistent use, an approved later migration must enforce append-only permissions for application roles and define retention. Phase 1 renders fictional activity locally and writes nothing.

## Operational controls before migration deployment

1. Review the generated SQL with the database owner.
2. Confirm migration 008 has been intentionally applied or excluded.
3. Back up the target Supabase project.
4. Apply to a staging project first.
5. Run permission and protected-contract tests.
6. Validate RLS using student, tutor, lecturer, adhoc, registry and admin accounts.
7. Record migration execution and rollback guidance.

## Rollback approach

The POC does not automate destructive rollback. If the additive schema must be removed, preserve/import-export all Continuum records first and execute a separately reviewed teardown migration. Existing protected tables remain unaffected by that process.
