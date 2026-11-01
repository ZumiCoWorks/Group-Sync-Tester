# Continuum Pilot Readiness

**Purpose:** Define the evidence required before describing a bounded Continuum pilot as usable. This is not a production approval and does not authorize implementation or deployment.

**Evidence date:** 29 October 2026

## Readiness rule

A capability is not pilot-ready because code, a screen, a migration or a deployment file exists. Pilot readiness requires an identified environment, passing acceptance evidence, server-side authorization, data ownership, operational support and named approval.

BCom remains the only proposed pilot context. A BCom result must not be generalized to other AFDA schools.

## Pilot scope boundary

The pilot may include only explicitly approved applications and workflows. CARS remains authoritative. Assessment functionality, if approved later, must be limited to reviewed preparation and manual transfer support. No direct CARS write, automatic grade calculation, silent conflict resolution or missing-mark-to-zero behavior is allowed.

## Readiness gates

### Gate A - Repository and deployment identity

Required:

- Active frontend and backend projects, aliases, root directories and deployed commits are identified.
- The active Supabase project is correlated with the deployed backend.
- Environment bindings are documented without exposing secret values.
- Legacy backend and migration copies have an explicit status.

Evidence: authorized DevOps/Vercel inventory, deployment record, environment map and health/readiness result.

### Gate B - Security containment

Required:

- RECON-010 Group Sync access behavior is verified in authorized non-production.
- FR-009/TR-012 session-code lifecycle, expiry, rate limiting and ownership are defined and tested.
- TR-034/RECON-011 environment-file exposure is assessed by the security owner.
- Service-role use, RLS, grants and route authorization are reviewed together.
- Direct API calls, URL manipulation and cross-resource access are denied where unauthorized.

Minimum tests:

- Anonymous Group Sync host mutation denied.
- Authenticated non-owner host mutation denied.
- Participant cannot upload, group, reset or end a session.
- Expired/revoked access denied.
- Replayed, guessed or rate-abusive session identifiers handled safely.
- Roster and participant fields are minimized by role.

### Gate C - Identity and permission parity

Required:

- Approved identity provider and stable internal identifier are documented.
- Roles, scopes, delegation, expiry and revocation are defined.
- Direct application entry and Continuum entry produce equivalent server-side decisions.
- Deep links reauthorize target resources.
- Administrative roles do not automatically grant unrestricted academic access.

Evidence: authorization matrix plus automated API/browser tests in an identified environment.

### Gate D - Application workflow acceptance

For each included application:

- Purpose, owner, data boundary, entry point and maturity are documented.
- Successful, denied, expired, malformed and dependency-failure paths are tested.
- Schedule publication and booking state reflect persisted backend state.
- WorkSuite requester, approval and conflict states are scoped and auditable.
- Group Sync roster import and session lifecycle are protected and recoverable.
- Student-facing public responses expose only approved fields.

### Gate E - Data and migration authority

Required:

- Live schema and applied migration history are identified for the pilot environment.
- RLS policies, grants, triggers, functions and service-role access are reviewed.
- One migration authority is approved for the environment.
- Backup, restore, rollback and recovery responsibilities are documented.
- Audit records, retention and deletion policies are approved.

No production migration is authorized by this document.

### Gate F - Assessment boundary, if included

Required before any assessment implementation:

- Academic owners provide representative synthetic or approved source files.
- One supported rubric format and versioning rule are approved.
- Student, module, cohort and assessment identifiers are approved.
- Missing, duplicate, invalid, unmatched and conflicting values have agreed handling.
- Reviewer and export approver roles are named.
- Module report format and manual CARS process are approved.
- Export prepared, transfer recorded and CARS confirmed are separate states.

Acceptance invariants:

- Missing marks remain missing.
- Conflicts are visible and not silently selected.
- Source values and corrections remain traceable.
- No averages, weights, totals, grades or final marks are calculated unless separately approved.
- Export creation never implies CARS update.

### Gate G - Operational and institutional approval

Required:

- Support owner and incident escalation path are named.
- Monitoring, error reporting and audit access are available.
- Accessibility and responsive checks are complete for the pilot workflows.
- Privacy, retention, data classification and approved tool usage are reviewed.
- User acceptance is complete for the selected roles.
- A named AFDA approver accepts scope, limitations and residual risks.

## Pilot test matrix

| Test ID | Scenario | Expected result | Evidence owner | Status |
|---|---|---|---|---|
| PILOT-AUTH-01 | Unauthenticated protected API request | 401/denial without data disclosure | Security/QA | Not run |
| PILOT-AUTH-02 | Valid role, wrong resource scope | Denied | App owner/QA | Not run |
| PILOT-AUTH-03 | Direct app versus Continuum entry | Same server-side decision | Platform/QA | Not run |
| PILOT-AUTH-04 | Expired/revoked access | Denied or safely reauthenticated | Identity owner | Not run |
| PILOT-GS-01 | Non-owner invokes Group Sync host operation | Denied and audited | Group Sync owner | Not run |
| PILOT-GS-02 | Participant attempts host operation | Denied | Group Sync owner | Not run |
| PILOT-GS-03 | Session code replay/guess/rate abuse | Safe denial/throttling/expiry | Security owner | Not run |
| PILOT-GS-04 | Roster read by unauthorized role | Denied or minimized projection | Privacy/DB owner | Not run |
| PILOT-SCH-01 | Schedule publication failure | Honest failure; recoverable input | Schedule owner | Not run |
| PILOT-SCH-02 | Cross-user booking/resource identifier | Denied | Schedule owner | Not run |
| PILOT-WS-01 | Requester reads another user's request | Denied | WorkSuite owner | Not run |
| PILOT-WS-02 | Approval by unauthorized role | Denied and audited | WorkSuite owner | Not run |
| PILOT-DB-01 | Anonymous/authenticated/service-role table access | Matches approved policy | DBA | Not run |
| PILOT-DB-02 | Applied migration history | Matches approved chain | DBA | Not run |
| PILOT-OPS-01 | Backup restore and rollback rehearsal | Documented successful recovery | IT/DevOps | Not run |
| PILOT-UX-01 | Loading, empty, denied, expired and failed states | Truthful and accessible | UX/QA | Not run |
| PILOT-ASMT-01 | Supported file mapping preview | No commit before review | Academic/product | Deferred |
| PILOT-ASMT-02 | Missing/conflicting/duplicate mark data | Flagged; no silent resolution | Academic/product | Deferred |
| PILOT-ASMT-03 | Versioned manual CARS export | Traceable and clearly not CARS confirmation | CARS owner | Deferred |

## Pilot exit criteria

The pilot may be described as usable only when:

- All applicable P0 findings are contained and verified.
- No unresolved critical authorization bypass affects pilot data.
- Deployment and database identity are known for the pilot environment.
- The approved migration chain and recovery plan are documented.
- Direct-entry parity is demonstrated for every included protected workflow.
- Included applications pass their success, denial and failure acceptance tests.
- Data ownership, role scope and support ownership are named.
- Assessment is either excluded explicitly or passes the separate academic gate.
- Synthetic or explicitly approved data is used.
- AFDA provides named sign-off for scope and residual risks.

## Explicit non-readiness conditions

The pilot is not ready when:

- Group Sync host operations remain accessible without verified authorization.
- Credential exposure status is unknown to the responsible security owner.
- The active backend or database project is unknown.
- Applied migrations and live policies cannot be identified.
- Tests rely only on mocked frontend responses.
- Prototype screens are used as evidence of operational assessment capability.
- A CARS export can be interpreted as confirmation of official record update.
- BCom evidence is presented as validation for other schools.

## Current readiness result

**Not ready for pilot declaration.** The repository contains useful operational foundations, but deployment identity, live database state, security verification, direct-entry parity and institutional ownership remain incomplete. Assessment/rubric work is deferred until the academic and CARS decisions are resolved.

### Current gate status

| Gate | Current result | Blocking evidence |
|---|---|---|
| A - repository/deployment identity | Not met | Competing backend/serverless configurations; active project, commit, DB and traffic unverified |
| B - security containment | Not met | Unauthenticated Group Sync host boundary; local credential containment is prepared, but rotation and remote-history verification remain owner-led |
| C - identity/parity | Not met | Provider/role decisions open; no direct-entry parity suite |
| D - application acceptance | Not met | Static implementation exists, but workflow/denial/failure evidence is incomplete |
| E - data/migrations | Not met | Five migration trees; live schema/applied history/RLS/grants unknown |
| F - assessment, if included | Not met / deferred | No operational rubric, mark import, exception, report or CARS-export service |
| G - operations/approval | Not met | Support, monitoring, recovery, accessibility/UAT and named sign-off absent |

### Test evidence recorded in this run

The backend Jest command ran on 29 October 2026: four suites passed, one failed during loading, and 18 tests passed. The failing current booking route suite has an incomplete middleware mock (`requireRole` is missing). No browser, live API, database-policy, migration, recovery or authorization tests were run. The pilot test matrix above therefore remains `Not run`/`Deferred` as shown.
