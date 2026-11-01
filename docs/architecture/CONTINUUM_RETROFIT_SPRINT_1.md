# Continuum Retrofit Sprint 1

**Sprint objective:** Close the highest-risk authorization gaps around the canonical backend and Group Sync, while producing auditable deployment/security evidence.

**Planning date:** 1 November 2026

**Change boundary:** Documentation and local test/code changes only until the review gate. No production database mutation, migration, secret change, or deployment is authorized by this plan.

## Outcome

Sprint 1 is complete when:

1. one backend tree is formally canonical and alternate deployable copies are blocked or at policy parity;
2. no Group Sync host mutation accepts a session code as its only authority;
3. public session/join responses expose only approved fields and are resistant to guessing/replay abuse;
4. the same allow/deny decision applies through direct Group Sync and Continuum entry;
5. the backend test suite loads completely and contains the required denial-path tests; and
6. an identified non-production deployment passes the acceptance suite before any production release decision.

Assessment, rubric, marks consolidation, module reports, and CARS integration are explicitly out of scope.

## Starting evidence

- Baseline commit: `4497f25cecff7be28decc8acccd6e877bc308b35` on `feature/afda-continuum-poc`.
- Active backend observed through authenticated Vercel CLI: project `afda-core-backend`, root `server/`.
- Supabase secret rotation and legacy-key revocation were verified; old credentials remain only in older Git history under the accepted temporary history decision.
- Type-check passed across all workspaces at the baseline.
- Backend lint completed with zero errors and 41 warnings.
- Backend tests: four suites passed, one suite failed during loading because its middleware mock omits `requireRole`; all 18 executed tests passed.
- Baseline critical gap: all direct `/api/group-sync` host routes lacked authentication. The local working tree now contains host guards and scoped projections; database-policy, distributed abuse-control, staging and owner-approval gates remain open.
- Alternate `backend/` Continuum routes are unauthenticated and use a service-role client if that tree is deployed.

## Work breakdown and dependencies

| ID | Work item | Depends on | Primary owner | Deliverable | Acceptance |
|---|---|---|---|---|---|
| S1-01 | Approve endpoint boundary matrix | None | Security + app owners | Reviewed [`security/ENDPOINT_AUTHORIZATION_MATRIX.md`](security/ENDPOINT_AUTHORIZATION_MATRIX.md) | Every route has an approved boundary and unresolved decisions have named owners. |
| S1-02 | Confirm canonical backend and disable ambiguity | S1-01 | DevOps/platform | Signed deployment map and disposition for `backend/` and `server/backend/` | Only the approved tree can be released; active project/root/alias/commit and rollback target are recorded. |
| S1-03 | Repair test harness | None | Backend | Booking-route mock includes the real middleware surface | All suites load; the repair does not weaken route middleware assertions. |
| S1-04 | Define Group Sync authorization contract | S1-01 | Security + Group Sync owner | Host, participant, lifecycle, field, and error contract | Decisions cover owner identity, delegation, expiry, replay, rate limits, and roster projection. |
| S1-05 | Implement host-owner enforcement | S1-02, S1-04 | Backend | Shared Group Sync guard used by direct routes | Anonymous, participant, non-owner, cross-session, expired, and ended-session mutations fail closed. |
| S1-06 | Implement join/discovery minimization and abuse controls | S1-04 | Backend + frontend | Approved public/participant projections and throttling/lifecycle behavior | Code guessing/replay is bounded; public responses contain no unapproved roster/PII fields. |
| S1-07 | Establish direct-versus-Continuum parity | S1-05, S1-06 | Platform + QA | Contract/integration tests for both entry paths | Identical identity, owner, capability, expiry, and denial results for the same action. |
| S1-08 | Verify non-production release candidate | S1-02 through S1-07 | QA + DevOps + security | Test report tied to commit and environment | All gates below pass; no production deployment occurs without separate approval. |
| S1-09 | Update incident/deployment evidence | S1-02, S1-08 | Security + DevOps | RB-001/RB-003 evidence update | Rotation, legacy-key rejection, environment bindings, history decision, and residual risk are recorded without secret values. |

### Local progress

- S1-03: canonical Jest discovery is restricted to `server/src`; the middleware mock exports the complete route surface.
- S1-05: direct host creation and mutations require canonical authentication plus session host ownership (with explicit admin override).
- S1-06: public and participant projections are minimized; direct frontend table writes/realtime subscriptions are removed; demo population is production-disabled.
- RB-004: a review-only [`security/GROUP_SYNC_RLS_REMEDIATION.md`](security/GROUP_SYNC_RLS_REMEDIATION.md), [access test matrix](security/GROUP_SYNC_RLS_TEST_MATRIX.md), and non-executable [SQL draft](security/sql/DRAFT_010_group_sync_deny_direct_access.sql) are prepared. Nothing has been applied to a database.
- Local verification: all workspace type-checks pass; canonical backend lint has zero errors and 41 baseline warnings; all 6 canonical backend suites pass (27 tests).
- Remaining before either item is complete: owner/DBA approval, identification of canonical migration authority, non-production RLS validation, distributed throttling, denied-action audit coverage, and identified non-production verification.

## Recommended implementation contract

These are safe defaults for review; exact durations and limits require owner approval.

### Identity and authority

- Direct and Continuum Group Sync routes use the same Supabase token verification and canonical `public.users.role_v2` mapping.
- Session creation requires an authenticated eligible staff identity and stores `host_id` from the verified token.
- Host actions require `session.host_id === user.id` or an active explicit workspace/service grant containing the required capability.
- `admin` bypass, if retained, must be explicit, narrow, tested, and audited. It must not be inferred from service-role database access.
- A session code identifies a session for joining; it never authorizes upload, grouping, reset, populate, end, or roster administration.

### Lifecycle

- Represent allowed transitions explicitly: `lobby -> active -> ended`; reset/populate rules are separate and environment-aware.
- Reject host and participant actions after expiry, revocation, or end, except approved read-only history.
- Make create/join/end operations idempotent where retries are expected.
- Store timestamps needed to explain allow/deny decisions; do not rely only on client state.

### Data minimization

- Public discovery returns only session name/status and approved join hints.
- Participant responses return only that participant's identity/status plus approved group information.
- Host roster responses use an explicit projection; never return database rows with `select('*')` by default.
- Errors do not reveal whether a guessed student identifier, email, or private session exists.

### Abuse resistance

- Rate-limit session creation, session-code lookup, join attempts, and file uploads by an approved combination of identity, session, and network signal.
- Avoid placing durable credentials in URLs or logs.
- Validate upload MIME/type, size, workbook structure, maximum rows, duplicates, and formula/unsafe cell behavior before mutation.
- Disable `/populate` in production; test/demo enablement must be explicit and authenticated.

## Test-first sequence

Write or update the failing tests before changing route behavior.

### Harness and identity

| Test ID | Scenario | Expected result |
|---|---|---|
| S1-HARNESS-01 | Booking route imports with mocked middleware | Suite loads and mock exports both `verifyToken` and `requireRole`. |
| S1-AUTH-01 | Missing bearer token on host route | `401`; no session/roster mutation. |
| S1-AUTH-02 | Invalid or expired token | `401`; generic response, no data disclosure. |
| S1-AUTH-03 | Valid user without canonical role | `403`; no metadata-role fallback. |
| S1-AUTH-04 | Expired ad-hoc access | Denied consistently through direct and Continuum routes. |

### Group Sync ownership and lifecycle

| Test ID | Scenario | Expected result |
|---|---|---|
| S1-GS-01 | Authenticated host creates session | `201`; `host_id` comes from token, not request body. |
| S1-GS-02 | Anonymous caller invokes group/end/upload/reset/populate | `401`; no mutation. |
| S1-GS-03 | Participant invokes a host action | `403`; no mutation. |
| S1-GS-04 | Authenticated non-owner uses a valid session code | `403` or non-enumerating `404`; no mutation. |
| S1-GS-05 | Host acts on another host's session | Denied and audited. |
| S1-GS-06 | Host action after session expiry/end | Conflict/denial matching the approved contract; no mutation. |
| S1-GS-07 | Duplicate end/retry | Idempotent approved result; no duplicate side effects. |
| S1-GS-08 | `/populate` in production mode | `404` or `403`; no mutation. |

### Join, privacy, and abuse

| Test ID | Scenario | Expected result |
|---|---|---|
| S1-GS-09 | Unknown/guessed code lookup | Generic not-found response without participant data. |
| S1-GS-10 | Public discovery for valid code | Only approved discovery fields returned. |
| S1-GS-11 | Repeated invalid join attempts | Throttled according to approved policy. |
| S1-GS-12 | Duplicate participant join/replay | Idempotent or explicit conflict; never duplicate participant rows. |
| S1-GS-13 | Participant reads session after join | Only self and approved group fields; no full roster. |
| S1-GS-14 | Unauthorized roster request | Denied or minimized projection. |
| S1-GS-15 | Oversized, malformed, duplicate, or wrong-type upload | Rejected before database mutation with safe error details. |

### Entry parity and alternate-tree controls

| Test ID | Scenario | Expected result |
|---|---|---|
| S1-PARITY-01 | Same host action through direct app and Continuum | Same allow result and source identity. |
| S1-PARITY-02 | Same non-owner action through both entry paths | Same denial status and no mutation. |
| S1-PARITY-03 | Revoked/expired workspace grant | Both paths deny immediately. |
| S1-DEPLOY-01 | Build/release from `backend/` or `server/backend/` | Blocked by approved repository/deployment control unless parity is proven. |
| S1-DEPLOY-02 | Legacy `/api/continuum/bootstrap` on candidate environment | Not routable without approved Platform-admin control; preferably absent. |

## Review and release gates

### Gate 1 — policy approval

- Security approves participant, host, staff, ops, and administrator boundaries.
- Group Sync owner approves join behavior and roster fields.
- DevOps confirms `server/` as canonical or supplies contradictory evidence before coding proceeds.

### Gate 2 — local implementation evidence

- Secret scan finds no private values in source, tests, fixtures, logs, or snapshots.
- Type-check succeeds for every workspace.
- Backend lint has no errors; warning delta is documented.
- All backend suites load and pass.
- New tests prove denial before success-only browser testing.

### Gate 3 — non-production verification

- Candidate deployment is tied to an exact commit and uses non-production/synthetic data.
- Direct API requests test anonymous, participant, non-owner, owner, expired, and revoked cases.
- Browser tests confirm truthful loading, denied, expired, ended, empty, and failure states.
- Logs/audits contain actor/action/resource/outcome without tokens, roster payloads, or uploaded file contents.
- Service-role, authenticated, and anonymous database access matches the approved route/RLS matrix.

### Gate 4 — production decision

Production deployment is a separate owner decision. It requires:

- security sign-off on the test report;
- app-owner acceptance of changed direct and Continuum workflows;
- DevOps rollback target and monitoring confirmation;
- DBA confirmation that no unapproved migration or RLS change is included; and
- explicit acceptance of remaining Git-history and legacy-tree risk.

## Rollout and rollback shape

1. Land tests and guards on the feature branch.
2. Deploy to an identified preview/staging project only.
3. Run API denial tests before UI acceptance tests.
4. Observe logs and audit events with synthetic data.
5. Obtain the production decision.
6. If released, monitor authentication failures, throttling, join failure rate, and host-action errors.
7. Roll back the deployment, not the database, unless an independently approved migration plan exists.

No Sprint 1 task requires a production database migration by default. If implementation discovers that lifecycle or delegation cannot be represented safely in the existing schema, stop and route the proposed additive migration through RB-006/DBA review.

## Explicit exclusions

- No rubric builder, mark import, grade calculation, assessment consolidation, or module report.
- No CARS write or representation that an export updates CARS.
- No identity-provider migration or Azure hosting change.
- No Git history rewrite under the current temporary history decision.
- No production secret, environment, RLS, migration, or deployment change without its separate approval gate.

## Sprint closeout packet

The final Sprint 1 review should contain:

- approved endpoint authorization matrix and decision log;
- canonical deployment map and alternate-tree disposition;
- code/test diff tied to a commit;
- full local check results with warning/failure deltas;
- non-production API and browser test evidence;
- data-field/projection inventory for Group Sync;
- release/rollback/monitoring record; and
- updated retrofit backlog statuses for RB-000 through RB-004 and RB-019.
