# Continuum Retrofit Backlog

This backlog is ordered by dependency. It is a planning artifact, not authorization to modify code, migrations, production configuration or institutional systems.

**Evidence date:** 29 October 2026

The first dependency-ready task is **RB-000**. It is documentation/security-design work only and can be completed locally without changing application code. Live containment and remediation then begin with RB-001 through RB-006 under the named owners.

## Status vocabulary

- `READY-LOCAL`: can be investigated or implemented locally after review.
- `BLOCKED-OWNER`: requires AFDA, security, DevOps, database or academic approval/evidence.
- `DISCOVERY`: repository or environment evidence still required.
- `DEFERRED`: intentionally after foundational work.

## Dependency-ordered tasks

| ID | Requirements | Current state | Likely files/components | Dependencies | Priority | Implementation / acceptance / regression tests |
|---|---|---|---|---|---|---|
| RB-000 | FR-004, TR-006, TR-012, RECON-009 to RECON-012 | Route and deployment evidence exists, but no approved owner/status register or endpoint policy matrix exists | This matrix/inventory; every `server/src/routes/*.ts`; backend/deploy configs | None | P0 / READY-LOCAL | Produce one review packet listing every endpoint as public, authenticated participant, owner/host, ops/admin or platform-admin; attach finding owners and requested decisions without changing code. Acceptance: security, app and DevOps owners can approve/reject each boundary and identify the active target. Regression: packet covers both `server/` and `backend/` divergences. |
| RB-001 | PLAN-002, PLAN-012, RECON-012 | Competing backend/deployment claims | `package.json`, `server/package.json`, `backend/package.json`, `api/vercel.ts`, `server/vercel.json`, `backend/vercel.json`, deployment docs | DevOps access | P0 / BLOCKED-OWNER | Confirm active project, root directory, commit, alias and API target. Acceptance: one signed deployment map. No source change initially. |
| RB-002 | FR-003, FR-004, FR-009, TR-006, TR-012, TR-040, RECON-010 | Group Sync routes lack auth/host ownership; code is bearer-like | `server/src/routes/group-sync.ts`, `backend/src/routes/group-sync.ts`, Group Sync client pages | RB-000, RB-001; security/app owner | P0 / BLOCKED-OWNER | Define participant versus host authority, session expiry, rate limits, projection and ownership. Tests: anonymous/non-owner/cross-session/expired/replayed/rate-abusive denial. |
| RB-003 | TR-034, TR-035, PLAN-005, RECON-011 | Local untracking and fallback removal prepared; rotation, deployed consumers and remote history unresolved | ignored local env files, Group Sync client config, deployment bindings/history | Security/DevOps incident process | P0 / BLOCKED-OWNER | Verify exposure without printing values, rotate/revoke, review history/logs, decide history treatment, verify server-only use. Tests: old credential rejection and browser-bundle scan in approved staging. |
| RB-004 | TR-036, TR-040, DATA-016 | Service-role client and permissive Group Sync RLS present | `server/src/index.ts`, Group Sync migrations | RB-001, RB-002; DBA access | P0 / BLOCKED-OWNER | Compare live policies/grants to repository. Acceptance: explicit route scope plus verified anon/auth/service-role matrix. |
| RB-005 | FR-001, FR-006, FR-009, TR-001 to TR-005, TR-009 | Supabase and `role_v2`; expiry/revocation incomplete | middleware and user/RBAC migrations | AFDA IT/security decision | P0 / BLOCKED-OWNER | Approve identity, stable ID, roles, null expiry, delegation, provisioning and revocation. Tests: malformed/expired/revoked/missing-role/ad-hoc/guest cases. |
| RB-006 | DATA-006, DATA-016, PLAN-008, RECON-012 | Five migration trees and divergent backend histories | All five migration trees | RB-001; DBA access | P0 / BLOCKED-OWNER | Identify applied history per environment and mark legacy copies. Acceptance: canonical migration authority, compatibility and rollback owner recorded. |
| RB-007 | FR-003 to FR-005, FR-008, TR-006 to TR-012, UX-004 | Direct-entry parity and object scope not proven | Continuum router, domain routes, frontend deep links | RB-001, RB-005 | P1 / READY-LOCAL after owner decisions | Build parity matrix and tests. Acceptance: same allow/deny result through portal, direct URL and direct API for each pilot workflow. |
| RB-008 | FR-037, TR-038, TR-040, UX-011 | Group Sync returns broad session/roster data and has limited import evidence | `server/src/routes/group-sync.ts`, `server/src/services/xlsx-parser.ts`, Group Sync UI | RB-002, RB-004 | P1 / READY-LOCAL after security design | Minimize projections, define retention and validate uploads. Tests: field-level privacy, malformed/duplicate/type/size/concurrency paths. |
| RB-009 | FR-002 to FR-005, TR-007, TR-014, TR-017, UX-012 | Schedule code and tests exist; runtime and object ownership unverified | `server/src/routes/batches.ts`, `bookings.ts`, `imports.ts`, `exports.ts`, slot/student apps | RB-005, RB-007 | P1 / READY-LOCAL | Test publication, cancellation, roster token, retries, duplicate booking and cross-user IDs. Preserve existing APIs. |
| RB-010 | FR-002 to FR-005, TR-007, TR-014, UX-013 | WorkSuite requester/approval routes exist; state and scope not fully proven | `server/src/routes/worksuite.ts`, venue-booking screens, venue migrations | RB-005, RB-007 | P1 / READY-LOCAL | Test requester isolation, ops/admin approval, overlap conflict and failed operation states. |
| RB-011 | FR-007, FR-010, UX-001, UX-005 | Continuum catalogue/workspace flows exist but maturity and availability states are incomplete | `apps/continuum/src/app/page.tsx`, `server/src/routes/continuum.ts`, platform API | RB-001, RB-005 | P1 / READY-LOCAL | Make evidence state explicit and test unavailable/empty/denied/expired states without implying authorization. |
| RB-012 | FR-035, TR-039, DATA-015 | Audit table/helper exists; coverage and append-only enforcement unclear | `audit_logs` migrations, `logAuditEvent`, `server/src/routes/audit-logs.ts` | RB-004, RB-006 | P1 / READY-LOCAL plus DBA review | Map consequential actions and verify no unauthorized update/delete. Tests: actor, target, outcome, timestamp and denied audit access. |
| RB-013 | FR-011 to FR-014, TR-013 to TR-018, DATA-001 | Integration boundaries are documented unevenly | route files, Continuum linking, docs/continuum | RB-001, RB-006, RB-009/RB-010 | P1 / READY-LOCAL | Document auth, request/response, errors, retries, versioning and ownership for selected pilot flows. Contract tests required. |
| RB-014 | UX-002 to UX-007, UX-016 to UX-018, PLAN-011 | UI states and accessibility are not acceptance-verified | app pages, shared UI, existing test plans | RB-007 to RB-010 | P2 / READY-LOCAL | Run approved browser/accessibility checks. Acceptance: loading, empty, failed, denied and expired states are truthful. |
| RB-015 | FR-015 to FR-021, TR-019 to TR-025 | Rubric workflow absent; fixtures only | Continuum presentation files, docs/continuum | Academic decisions and source files | P2 / BLOCKED-OWNER | Approve one real format, identifiers, storage and template lifecycle before implementation. No code until approved. |
| RB-016 | FR-022 to FR-027, TR-026 to TR-033 | Assessment import/consolidation absent | No confirmed operational route/schema | RB-015, RB-006, academic/CARS approval | P2 / DEFERRED | Design staged import, mapping, matching, missing/conflict/duplicate/invalid handling and correction history. Tests must prove missing != zero and no silent conflict choice. |
| RB-017 | FR-028 to FR-034, DATA-014, RECON-007 | Module report/export workflow absent | No confirmed assessment entities/routes; CARS docs | RB-016 and CARS owner | P2 / DEFERRED | Define report/version/export/transfer states and provenance. Acceptance must not claim CARS updated from export creation. |
| RB-018 | DATA-002, DATA-006, DATA-010, DATA-012 to DATA-016 | Proposed assessment schema is conceptual | Schema proposal and existing migrations | RB-006, RB-015 to RB-017 | P2 / DEFERRED | Map entities to authoritative existing structures or justify new ones. No migration until ownership, constraints, backup and rollback approved. |
| RB-019 | PLAN-002, PLAN-003, PLAN-011, PLAN-012, TR-042, TR-044 | Deployment, monitoring, support and test evidence incomplete | Vercel configs, package scripts, tests and docs | RB-001, RB-006 | P1 / BLOCKED-OWNER | Establish release, rollback, backup, monitoring, support and synthetic-data controls. Acceptance: named owner and evidence per environment. Fix the current booking-test middleware mock before relying on the suite. |
| RB-020 | All pilot requirements | Phase 0 exit not yet evidenced | All artifacts above | RB-001 through RB-019 as applicable | P0 / BLOCKED-OWNER | Sponsor accepts security, deployment, migration, ownership and test evidence. Only then select a bounded pilot workflow. |

## Locally executable work

These can be completed without live access or source changes:

- Compare backend trees and route registration.
- Build a static route-to-middleware inventory.
- Enumerate migrations and overlapping schema objects.
- Inspect manifests, Vercel configs and environment variable names only.
- Review existing tests and identify gaps.
- Draft API contracts, authorization matrices and acceptance tests.
- Label requirements and document statuses.

## Owner-authorized work only

These require approved access or decisions:

- Credential exposure verification, rotation or revocation.
- Vercel project, traffic and environment inspection.
- Production or staging API authorization tests.
- Supabase project, schema, RLS, grants and migration-history inspection.
- Backup/restore and rollback tests.
- Institutional role, identity, retention and CARS decisions.
- Collection of real rubric and mark-file formats.

## Retrofit principles

1. Preserve existing application boundaries and public APIs where safe.
2. Fix shared security foundations before building assessment features.
3. Prefer additive mappings and contracts over duplicating domain tables.
4. Do not select a migration tree by repository naming alone.
5. Do not use prototype fixtures as assessment acceptance data.
6. Do not introduce grade calculations, silent conflict resolution or false CARS status.
7. Record tests as executed only when results are available from an identified environment.
