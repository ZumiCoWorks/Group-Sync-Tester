# AFDA Continuum — Role, Input and Interconnection QA

QA date: 28 September 2026

Branch: `feature/afda-continuum-poc`

Scope: Continuum operational shell, canonical API, migration 009 and hand-offs to existing services

## Verdict

Continuum has a defensible orchestration foundation, but it is **not ready to be described as a fully connected, multi-role LMS**. The local frontend and backend compile, the live schema is available, and the first governed Group Sync write path has explicit input/result lineage. Role-scoped reads, scoped-grant administration and permission-aware controls are implemented locally. The deployed backend does not yet contain the Continuum routes, and the live tenant has no configured Continuum workspace or multi-role fixtures.

The correct current statement is:

> Continuum can become the authenticated orchestration front door for existing AFDA services. Its first implemented end-to-end workflow is workspace-scoped Group Sync session creation. Schedule and Spaces & Resources are currently connected as read/deep-link experiences, while CARS remains deliberately disconnected.

No live records were created or changed during this QA.

## Post-QA hardening completed locally

These changes are code-complete and verified locally, but remain unavailable on the hosted prototype until the feature-branch previews are deployed.

| Finding | Resolution | Verification |
| --- | --- | --- |
| Broad non-admin source reads | Schedule and Group Sync records are limited to records explicitly linked to workspaces covered by an active grant | Backend build and code review |
| No grant administration | Admin-only create and soft-revoke endpoints plus a workspace grant interface were added | Backend build and browser fixture |
| Unauthorized actions appeared enabled | The interface now uses returned effective access to disable Group Sync orchestration without a grant | Admin, lecturer and operations browser fixtures |
| Errors appeared as success | Success and error notices now have distinct semantics, colour and `role=alert` behavior | Browser fixture |
| Mobile sign-out missing | Sign-out remains available at 390 × 844 and form controls use mobile-safe sizing | Mobile browser fixture |
| Capability rules lacked direct tests | Five unit tests cover matching, expired, revoked, future, mismatched and admin-bypass cases | 5/5 targeted tests passed |

No additional migration is required for these fixes. They use the access-grant, record-link and audit structures already provided by migration 009.

## Evidence levels

| Evidence | Meaning |
| --- | --- |
| Live verified | Read-only check against the resumed Supabase project or deployed backend |
| Local verified | Built or exercised against the local application/API |
| Fixture verified | Browser behavior exercised with intercepted fictional responses; no database write |
| Code verified | Authorization, validation and lineage reviewed in implementation |
| Not testable yet | Required deployed route, account, grant or configured record does not exist |

## Environment findings

| Check | Result | Evidence |
| --- | --- | --- |
| Production backend readiness | Pass | `GET /api/ready` returned HTTP 200 with database `ok` |
| Production Continuum route | Blocked | `GET /api/continuum/overview` returned HTTP 404; current backend deployment predates the route |
| Local unauthenticated boundary | Pass | Local `GET /api/continuum/overview` returned HTTP 401 `MISSING_TOKEN` |
| Continuum production build | Pass | Next.js production build completed; `/`, `/presentation`, `/presentation/deck` and activity route emitted |
| Continuum type-check | Pass | `tsc --noEmit` completed |
| Continuum lint | Pass | Continuum ESLint completed with no findings |
| Canonical backend build | Pass | TypeScript build completed |
| Canonical backend lint | Baseline fail | Two existing `prefer-const` errors in `xlsx-parser.ts`; Continuum route produced warnings only |
| Canonical backend tests | Baseline fail | 2 suites passed, 2 failed: middleware mock/circular import and stale parser summary |

## Live tenant inventory

The live inventory was aggregated without returning IDs, names or email addresses.

| Item | Live count/state |
| --- | --- |
| Canonical profiles | 4 `admin`; no lecturer, tutor, adhoc, operations or student profile available for role QA |
| Continuum workspaces | 0 |
| Workspace-service assignments | 0 |
| Scoped access grants | 0 |
| Workflow runs | 0 |
| Record links | 0 |
| Continuum audit events | 0 |

Migration 009 is applied and its service registry is present, but this is an empty configured state—not a completed BCom setup.

### Existing source records

| Owning workflow/table | Live count | Continuum treatment |
| --- | ---: | --- |
| Schedule batches | 34 | Recent records can be read; no workspace ownership inferred |
| Schedule slots | 626 | Remain inside Schedule; not directly listed by the current overview |
| Student bookings | 438 | Remain inside Student Public/Schedule; not exposed as Continuum academic records |
| Group Sync sessions | 7 | Recent records can be read; only newly traced sessions receive a Continuum link automatically |
| Group Sync participants | 81 | Counted against returned sessions; ownership remains with Group Sync |
| Spaces & Resources requests | 0 | Current-user read is implemented, but there are no live records to show |

These counts prove that the existing applications retain data and remain operational. They do **not** prove a BCom/workspace relationship, because the live tenant has zero `continuum_record_links`.

## User-flow matrix

| User | Intended journey | Current behavior | QA status |
| --- | --- | --- | --- |
| Continuum administrator | Sign in → create institution/period/workspace → enable a service → create a traced Group Sync session → inspect source result and audit | API and UI exist locally. Workspace and service mutations are admin-only. Group Sync write-through records a workflow input, source record and mapping. Production API route is not deployed. | Local/code verified; live end-to-end blocked |
| Lecturer / tutor | Sign in → read permitted workspace/service context → perform a workflow only when granted a scoped capability | Backend requires an active `orchestrate_workflows` or `group_sync_manage` grant. Returned effective access scopes visible workspaces and linked records, and the UI disables the action without a grant. | Code and fixture verified; live role unavailable |
| Ad hoc assessor | Sign in before global expiry → access only granted workspace/service capabilities → lose access on expiry/revocation | Global `access_expires_at` and scoped grant time/revocation checks exist. Admin grant creation and soft revocation are implemented; no live adhoc profile exists. | Code verified; end-to-end not testable |
| Operations venue administrator | Sign in → see own Spaces & Resources requests → deep-link to WorkSuite → no institution setup authority | Own-request filtering exists. Workspace setup and ungranted Group Sync orchestration are disabled/403. | Fixture/code verified; live role unavailable |
| Student | Continue through Student Public for anonymous booking discovery/claim; no access to protected Continuum orchestration data | Student is excluded from the Continuum staff-role gate. No operational student Continuum experience is implemented. | Code verified; live role unavailable |
| CARS/Registry user | Continue to use CARS for official academic/registry records | No CARS connector, write path or handoff is implemented. This preserves the agreed ownership boundary. | Correctly dependent/disconnected |

## Input → processing → result trace

| Flow | User inputs | Processing and ownership | Result shown/recorded | Audit/lineage | Status |
| --- | --- | --- | --- | --- | --- |
| Create workspace | Institution name/short name, period/year/dates, workspace name/code, programme label | Continuum upserts institution and period, then creates the workspace | Configured workspace and active period | `continuum_workspace_created` audit event | Implemented locally; production route absent |
| Enable service | Selected workspace, service ID, enabled flag, configuration | Continuum updates the additive workspace-service relationship | Service enabled/disabled for that workspace | `continuum_workspace_service_updated` audit event | Implemented locally; admin only |
| Create Group Sync session | Workspace and session name | Continuum validates service enablement and capability, records input, then writes to source-owned `sync_sessions` | Session code/status returned from Group Sync source table | Workflow run + record link + `continuum_group_sync_session_created` audit event | First implemented write-through flow |
| Schedule | Existing batch/slot/booking records | Schedule remains owner; Continuum reads recent batches | Batch list and deep link | Existing records only receive workspace context when an explicit record link exists | Read/deep-link only |
| Spaces & Resources | Existing signed-in user's venue requests | WorkSuite remains owner | Current user's request list and deep link | No Continuum request-creation lineage yet | Read/deep-link only |
| CARS | None | CARS remains official owner outside this POC | Proposed/disconnected connector only | None | Deliberately not implemented |

## Interconnection map

```text
Supabase Auth + public.users.role_v2
                │
                ▼
       Continuum canonical API
        │        │          │
        │        │          └── WorkSuite / venue_booking_requests
        │        │              current-user read + external deep link
        │        └──────────── Schedule / batches
        │                       institution-wide staff read + external deep link
        └───────────────────── Group Sync / sync_sessions
                                governed write-through + record link

Continuum context tables
  institutions → periods → workspaces → enabled services
                                      → scoped access grants
                                      → workflow input/result records
                                      → source-record links

CARS and Microsoft 365: disconnected/dependent; no live path
```

### What is genuinely connected

- One Supabase tenant and canonical `users.role_v2` identity source.
- One canonical Express API for Continuum aggregation and orchestration.
- Additive workspace/service relationships without modifying protected Schedule, Group Sync or WorkSuite contracts.
- A real Group Sync source write, plus explicit workflow and record-link provenance.
- Environment-controlled deep links to independently deployed applications.

### What does not yet feel like one product

- Separate Vercel origins do not share browser local storage, so a user may have to authenticate again when opening another app even when all apps use the same Supabase project.
- Existing applications have not yet adopted the Continuum shell, navigation or current visual system.
- Schedule and WorkSuite do not yet return to Continuum with a signed context or completed handoff state.
- Existing Schedule/Group Sync records are not automatically assigned to a workspace; this is intentionally safe, but no mapping workflow exists yet.
- Cross-app authentication and return context are not yet unified, even though Continuum now administers its own scoped grants.

## Priority findings

### P0 — Blocking

1. **The deployed backend does not expose the Continuum API.** The production frontend cannot load the operational shell successfully until the backend branch is deployed with `/api/continuum` mounted.

### P1 — Major

1. **Cross-service writes are not atomic.** Workspace creation and Group Sync orchestration use multiple independent REST operations. A later failure can leave an institution/period, source session or workflow record without the intended final relationship, and retry can create duplicates.
2. **Multi-role live QA fixtures do not exist.** The tenant only has admin profiles, preventing genuine lecturer, tutor, adhoc, operations and student verification.
3. **Route-level coverage remains incomplete.** Pure capability rules now have five passing unit tests, but the complete Continuum route still needs tests for role gates, input validation, partial failures and lineage consistency.

### P2 — Minor / next pass

1. **Cross-app experience is a deep link, not a handoff.** There is no return token, workspace context transfer or completion callback.
2. **Audit insertion is best-effort.** `logAuditEvent` logs database errors but does not fail the user operation, so an apparently successful governed action can lack an audit row.
3. **Visual-system drift is measurable.** The operational CSS uses numerous colours, radii and font sizes outside `docs/DESIGN.md`; the UI is coherent on its own but no longer implements the documented square “orchestration ledger” system.
4. **Small operational text is overused.** Many labels and record details use 9–10px type, reducing projector and low-vision readability even where contrast is acceptable.

## Interface audit score

| Dimension | Score | Key finding |
| --- | ---: | --- |
| Accessibility | 3/4 | Labels, focus and reduced-motion handling are present; status semantics and very small text need work |
| Performance | 4/4 | Small client surface, optimized images and no expensive motion found |
| Responsive design | 3/4 | Layout reflows without page overflow and preserves sign-out; compact navigation still depends on horizontal scrolling |
| Theming | 1/4 | Extensive hard-coded palette/radius/type values diverge from the documented system |
| Implementation integrity | 3/4 | Product-specific flow, role affordances and scoped authority now align locally; deployed and live-role verification remain |
| **Total** | **14/20** | **Strong internal POC; deployment and live-role QA remain** |

The implementation-integrity verdict is **not yet release-verified, but pass for an internal POC**. The interface visibly expresses Continuum rather than a generic dashboard, and the local build now aligns advertised capability with effective scoped authority.

## Recommended QA sequence

1. Deploy the canonical backend to a preview/staging target and verify `/api/continuum/overview` returns 401 without a token rather than 404.
2. Create fictional test profiles for `admin`, `lecturer`, `tutor_senior`, `adhoc`, `ops_venue_admin` and `student`; do not reuse real staff/student identities.
3. Add a BCom QA workspace, enable Group Sync and add time-bound grants for the lecturer/tutor/adhoc fixtures.
4. Run the administrator path and verify all four evidence layers: source record, record link, workflow result and audit row.
5. Run allow/deny tests for each role, including expired/revoked grants and an expired adhoc account.
6. Add route-level tests for partial failures and lineage consistency.
7. Define an authenticated cross-app handoff pattern and a shared shell/token package before claiming one-product continuity.
8. Re-run live multi-role and mobile QA against the deployed preview.

Suggested Impeccable follow-up order: `$impeccable harden` for permission/error states, `$impeccable adapt` for mobile sign-out/navigation, `$impeccable document` to reconcile the implemented visual system, then `$impeccable polish`.
