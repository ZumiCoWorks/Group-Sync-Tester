# Continuum Requirements-to-Codebase Matrix

**Evidence date:** 29 October 2026  
**Scope:** static repository reconciliation plus the local test run recorded below; no live deployment, database, credential, or production-system inspection  
**Sources:** PRD v0.2, TRD v0.2, UI/UX Design Brief v0.2, Backend Schema Proposal v0.2, Implementation Plan v0.2, Codebase Alignment Review v0.2, and the prior audit/decision register in this repository

## Reading the matrix

`MATCH` means inspected repository evidence is consistent with the requirement for the stated scope; it does not mean deployed or institutionally approved. `PARTIAL` means only part is evidenced. `MISMATCH` means inspected behavior contradicts the requirement. `MISSING` means an adequate search found no operational implementation. `UNVERIFIED` means code/configuration exists but runtime evidence is insufficient. `DECISION REQUIRED` means an institutional or ownership decision prevents a reliable implementation conclusion.

Every PRD `FR` and TRD `TR` is listed separately. Stable `UX`, `DATA`, `PLAN`, and `RECON` IDs enumerate additional material requirements from the remaining supplied documents. Exact duplicates point back to the canonical FR/TR row rather than being counted twice.

No separately versioned file titled “v0.3 decision register” was present in the attachments or repository. The prior `docs/architecture/audit` decision/findings artifacts and every named carry-forward item in the request are therefore represented by `RECON-009` through `RECON-014`; their status is not treated as resolved.

## PRD functional requirements

| ID | Source / subsystem | Intended behavior and acceptance | Repository evidence | Status | Gap, retrofit, dependencies | Test / observable acceptance | Pri / order |
|---|---|---|---|---|---|---|---|
| FR-001 | PRD 8.1 / identity | Approved authentication protects functionality | `server/src/middleware.ts:verifyToken`; Continuum router uses it | PARTIAL | Group Sync/public route boundary and provider approval unresolved | Anonymous protected calls deny; approved public calls expose approved fields only | P0 / 2 |
| FR-002 | PRD 8.1 / entry | Authorized users enter each app directly | Independent Next apps under `apps/*`; root `app/` also runnable | UNVERIFIED | Deployment and end-to-end task evidence absent | Same authorized task succeeds from direct URL in identified environment | P0 / 4 |
| FR-003 | PRD 8.1 / parity | Portal/direct entry yield equivalent permissions | Continuum grants; Schedule/WorkSuite role checks; Group Sync host API none | MISMATCH | Common decision contract after identity and Group Sync remediation | Portal, direct UI and direct API have same allow/deny result | P0 / 4 |
| FR-004 | PRD 8.1 / authorization | Server checks every protected action and target | Many role-guarded routes; `server/src/routes/group-sync.ts` has no auth wrapper | MISMATCH | Add host ownership and per-route policy | Negative tests for anonymous, role, owner, scope and tampered ID | P0 / 2 |
| FR-005 | PRD 8.1 / scope | Access accounts for institutional/domain scope | Continuum grants and `hasContinuumCapability`; WorkSuite requester filter | PARTIAL | Domain object checks and approved scope model inconsistent | Cross-workspace/batch/session/request calls deny | P0 / 3 |
| FR-006 | PRD 8.1 / roles | Explicit roles/delegation with expiry/revocation/reassignment | `role_v2`, `access_expires_at`, grant create/revoke | PARTIAL | Delegation/reassignment/null-expiry policy unresolved | Expired/revoked/delegated cases enforce approved policy | P1 / 3 |
| FR-007 | PRD 8.1 / catalogue | User-specific app/action catalogue with status | Continuum page and `GET /api/continuum/overview` | PARTIAL | Availability/maturity metadata and auth semantics incomplete | Role sees correct catalogue; visible card grants no API authority | P1 / 5 |
| FR-008 | PRD 8.1 / deep links | Authorized links open specific resources | Service URLs and `continuum_record_links` | UNVERIFIED | Target reauthorization/stable-link tests absent | Tampered/expired/unavailable link fails safely | P1 / 5 |
| FR-009 | PRD 8.1 / sessions | Expired/revoked/insufficient access fails safely | Token lookup; ad-hoc/grant expiry and grant revocation checks | PARTIAL | Auth-session and Group Sync code lifecycle undefined | Revoked role/grant/session/code loses access | P0 / 3 |
| FR-010 | PRD 8.2 / registry | Purpose, owner, maturity, entry, boundary and contract recorded | `continuum_services`; audit docs | PARTIAL | Owners/support/deployed status/contracts incomplete | Complete owner-approved registry per pilot app | P1 / 5 |
| FR-011 | PRD 8.2 / ownership | Domain apps retain rules/data absent approved shared service | Separate UIs/routes; shared Supabase tables | PARTIAL | Physical ownership/backend/database authority undecided | Ownership register maps every pilot entity/write path | P0 / 4 |
| FR-012 | PRD 8.2 / integration | Cross-app actions use documented authorized mechanisms | Continuum links and creates source Group Sync sessions | PARTIAL | Contract/idempotency/timeout/failure semantics undocumented | Contract tests prove auth, errors, retry and owner | P1 / 5 |
| FR-013 | PRD 8.2 / workflow | Portal shows authorized status/next actions | Overview aggregates workspaces, links, workflows and source records | PARTIAL | Live/unavailable/empty/fixture states not fully separated | Source failure shows unavailable, never empty-success | P1 / 5 |
| FR-014 | PRD 8.2 / failures | Failures visible; retry avoids duplicates | Route errors and workflow records exist | UNVERIFIED | Multi-write flow lacks transaction/idempotency evidence | Injected retry creates no duplicate and shows truthful status | P1 / 5 |
| FR-015 | PRD 8.3 / rubric | Upload/select supported versioned master rubric | No operational route/table/service; fixtures only | MISSING | Approved format/owner/storage required | Approved synthetic template gets immutable version | P2 / 8 |
| FR-016 | PRD 8.3 / rubric | Validate type/structure before generation | No operational validator | MISSING | Define supported structure/limits | Bad type/shape rejected without batch | P2 / 8 |
| FR-017 | PRD 8.3 / rubric | Preview mapping and missing/ambiguous fields | No operational preview | MISSING | Staged preview after contract | Preview lists every unresolved required field | P2 / 8 |
| FR-018 | PRD 8.3 / rubric | Populate approved authorized context | Fictional BCom presentation data only | MISSING | Approve identifiers/source/scope | Wrong cohort/module denied; exact approved context used | P2 / 8 |
| FR-019 | PRD 8.3 / rubric | Preserve original; trace copies to version/batch | No storage/version/batch model | MISSING | Storage/retention/version decisions | Original checksum unchanged; copy links to version/batch | P2 / 8 |
| FR-020 | PRD 8.3 / rubric | Confirm generation after preview | No generation workflow | MISSING | Explicit state transition | No output before authorized confirmation | P2 / 8 |
| FR-021 | PRD 8.3 / rubric | Reject/review unsupported formats | No rubric input path | MISSING | Supported-format register | Unsupported fixture gets explicit rejection/review state | P2 / 8 |
| FR-022 | PRD 8.4 / marks | Import agreed spreadsheets/completed rubrics | XLSX code handles bookings/rosters, not marks | MISSING | Academic/CARS source contract | Approved synthetic file creates staged batch only | P2 / 9 |
| FR-023 | PRD 8.4 / marks | Preview fields/mappings/issues before commit | No assessment preview | MISSING | Staged parser/mapping UI | No assessment record committed before confirmation | P2 / 9 |
| FR-024 | PRD 8.4 / matching | Stable student/assessment IDs; ambiguity flagged | No assessment matching; roster parser has name fallback | MISSING | Approved IDs; name fallback cannot finalize | Unmatched/ambiguous rows stay unresolved | P2 / 9 |
| FR-025 | PRD 8.4 / values | Preserve source meaning; no inference/zero substitution | No assessment model | MISSING | Raw/normalized/corrected representations | Missing round-trips distinct from zero | P2 / 9 |
| FR-026 | PRD 8.4 / exceptions | Detect unmatched/missing/duplicate/conflict/invalid/wrong-context | No mark-exception service | MISSING | Approved validation/range rules | Fixture for every category creates visible exception | P2 / 9 |
| FR-027 | PRD 8.4 / review | No silent conflict choice; record authorized resolution | No resolution workflow | MISSING | Reviewer authority via ADR-08 | Conflict blocks approval until audited resolution | P2 / 9 |
| FR-028 | PRD 8.4 / reports | One per-module report of recorded marks | No module-report entity/route | MISSING | Define report scope | One versioned report/module; no cross-module rows | P2 / 10 |
| FR-029 | PRD 8.4 / no grading | No averages/weights/totals/grades/final marks | No operational consolidation | MISSING | Encode prohibition in model/API/UI/tests | Output exposes recorded values only | P1 / 10 |
| FR-030 | PRD 8.4 / provenance | Value traces to file/batch/row/correction | No assessment provenance entities | MISSING | Source/batch/record links | Report cell drills to source/history | P2 / 9 |
| FR-031 | PRD 8.4 / state | Distinct imported/pending/reviewed/approved/exported states | No assessment state machine | MISSING | Approve actors/transitions | Invalid transition/unauthorized approval denies | P2 / 10 |
| FR-032 | PRD 8.4 / CARS | Reviewed versioned manual-CARS export | Docs say disconnected; no operational export | MISSING | ADR-09 format/procedure | Approved report yields agreed versioned file | P2 / 10 |
| FR-033 | PRD 8.4 / transfer | Record manual status without false CARS claim | Boundary documented; no operational states | MISSING | Separate export/transfer/external confirmation | UI/audit never equates export with CARS update | P1 / 10 |
| FR-034 | PRD 8.4 / history | Context/version/time/approval/provenance; no overwrite | No export-batch model | MISSING | Immutable history model | Re-export creates version; earlier history remains | P2 / 10 |
| FR-035 | PRD 8.5 / audit | Actor/action/target/time/outcome for material actions | `audit_logs`, `logAuditEvent`, audit routes | PARTIAL | Coverage, denied outcomes, append-only and retention unverified | Audit matrix covers all pilot consequential actions | P0 / 6 |
| FR-036 | PRD 8.5 / admin | Admin does not imply unrestricted academic access | Role gates and Continuum admin checks | PARTIAL | Broad/service-role paths and academic separation unresolved | Platform admin without academic grant cannot access marks | P0 / 3 |
| FR-037 | PRD 8.5 / files | Type/size validation and private controlled storage | Multer limits and in-memory parsing | PARTIAL | MIME/content/private storage/malware/retention absent | Malformed/oversize/unauthorized retrieval deny | P0 / 6 |
| FR-038 | PRD 8.5 / exceptions | Exception resolution history attributable | General audit; no mark exceptions | MISSING | Depends on FR-026/027 | Original/corrected values, actor and reason retained | P2 / 9 |
| FR-039 | PRD 8.5 / lifecycle | Approved retention/archive/delete/access controls | No approved policy | DECISION REQUIRED | ADR-12/data owners | Policy mapped to jobs/access/audit and approved | P1 / 1 |

## TRD technical requirements

| ID | Source / subsystem | Intended behavior and acceptance | Repository evidence | Status | Gap, retrofit, dependencies | Test / observable acceptance | Pri / order |
|---|---|---|---|---|---|---|---|
| TR-001 | TRD 5.2 / identity | Approved provider per environment | Supabase Auth implemented | DECISION REQUIRED | AFDA provider/tenant/MFA approval absent | ADR-04 records approved choice | P0 / 1 |
| TR-002 | TRD 5.2 / identity | Provider subject maps to stable internal ID, not email/name | `auth.getUser` UUID maps to `public.users.id` | PARTIAL | Federation/external-subject contract absent | Stable mapping lifecycle test | P0 / 3 |
| TR-003 | TRD 5.2 / sessions | Approved expiry/storage/revocation | Supabase sessions; Schedule copies token to localStorage | PARTIAL | Storage/revocation policy unreviewed | Expired/revoked token rejected; storage approved | P0 / 3 |
| TR-004 | TRD 5.2 / lifecycle | Provision/update/suspend/remove temporary/external users | Role/expiry fields only | MISSING | Owner/process absent | Lifecycle test covers all states | P1 / 3 |
| TR-005 | TRD 5.2 / authz | Authentication never implies authorization | `requireRole` and grants on some routes | PARTIAL | Group Sync/object checks inconsistent | Authenticated unauthorized calls deny | P0 / 2 |
| TR-006 | TRD 5.4 / backend | Trusted backend checks protected reads/writes/exports/admin | Many guards; Group Sync none | MISMATCH | Retrofit route/resource policies | Explicit policy and negative test per route | P0 / 2 |
| TR-007 | TRD 5.4 / resource | Verify specific resource, not role only | WorkSuite own-request filter; grants/links | PARTIAL | Broad Schedule/export/audit access needs tests | Cross-owner ID swaps deny | P0 / 3 |
| TR-008 | TRD 5.4 / privilege | Grant only needed actions/records | Broad role lists and service client | MISMATCH | Action/scope matrix and narrow queries | Role denied unrelated operations/records | P1 / 3 |
| TR-009 | TRD 5.4 / revocation | Expired/revoked assignments cease authorization | Grant/ad-hoc expiry checks | PARTIAL | Session/role propagation undefined | Boundary-time and active-session tests | P0 / 3 |
| TR-010 | TRD 5.4 / admin | Separate platform/school/academic administration | Partial Continuum admin separation | PARTIAL | School/reviewer authorities absent | Each admin persona denied outside domain | P1 / 3 |
| TR-011 | TRD 5.4 / parity | Automated direct-entry parity evidence | No dedicated suite | MISSING | Canonical environment/role contract required | Parity matrix passes for pilot actions | P1 / 4 |
| TR-012 | TRD 5.4 / default | Missing/invalid/ambiguous permission denies | Middleware denies missing role; Group Sync/RLS broadly permit | MISMATCH | Remove implicit host grants/permissive policy | Missing owner/scope never grants host access | P0 / 2 |
| TR-013 | TRD 6.2 / contracts | Document purpose/shape/auth/authz/errors/versioning | Route code/scattered docs only | MISSING | Per-pilot contracts | Owner-approved contract and tests | P1 / 5 |
| TR-014 | TRD 6.2 / domain | Domain validates request/rules | Booking, batch, WorkSuite, parser validation | PARTIAL | Coverage/Group Sync incomplete | Valid/invalid/unauthorized tests | P1 / 5 |
| TR-015 | TRD 6.2 / coupling | No undocumented cross-app DB coupling | Shared backend/database; boundary unknown | UNVERIFIED | Map every write/read to owner/contract | No unexplained cross-domain access | P1 / 4 |
| TR-016 | TRD 6.2 / errors | Meaningful errors without sensitive internals | `ApiError`; `api/vercel.ts` can return raw message | PARTIAL | Normalize production-safe errors | Failure has code/no sensitive details | P1 / 5 |
| TR-017 | TRD 6.2 / retries | Duplicate prevention/idempotency | Some uniqueness checks; multi-write flow non-atomic | UNVERIFIED | Per-mutation idempotency | Repeat produces one intended result | P1 / 5 |
| TR-018 | TRD 6.2 / compatibility | Contract changes do not silently break clients | No versioned contract suite | UNVERIFIED | Compatibility/version discipline | Old supported client remains passing | P1 / 5 |
| TR-019 | TRD 8.1 / rubric | Accept only approved formats | No rubric service | MISSING | Academic format decision | Unsupported input rejected | P2 / 8 |
| TR-020 | TRD 8.1 / files | Validate type/size/structure/malware if required | No rubric service | MISSING | File/storage policy | Bad file rejected/audited | P2 / 8 |
| TR-021 | TRD 8.1 / versions | Stable template ID/version referenced by copies | No rubric entities | MISSING | Schema mapping | Used version immutable | P2 / 8 |
| TR-022 | TRD 8.1 / preview | Show mappings/unresolved fields | No rubric preview | MISSING | Staged preview | Ambiguity visible pre-confirmation | P2 / 8 |
| TR-023 | TRD 8.1 / confirm | Authorized explicit generation | No workflow | MISSING | Role/state design | No output before confirmation | P2 / 8 |
| TR-024 | TRD 8.1 / preservation | Preserve master; link output to batch/context | No storage/batches | MISSING | Storage/retention decision | Master unchanged/traceable | P2 / 8 |
| TR-025 | TRD 8.1 / context | Approved complete authorized context | Fictional context only | MISSING | Approved academic source/IDs | Wrong/incomplete context blocks | P2 / 8 |
| TR-026 | TRD 8.3 / provenance | Retain source/raw distinct from corrections | No mark-import domain | MISSING | Retention/privacy decisions | Raw source/checksum/value traceable | P2 / 9 |
| TR-027 | TRD 8.3 / matching | Stable IDs; names cannot silently finalize | No mark matching | MISSING | Identifier decision | Name-only ambiguity blocks | P2 / 9 |
| TR-028 | TRD 8.3 / duplicate | Detect duplicates within/across imports | No mark imports | MISSING | Define duplicate scope | Duplicates flagged, not discarded | P2 / 9 |
| TR-029 | TRD 8.3 / conflict | Flag inconsistent sources | No mark imports | MISSING | Define record identity | Conflict blocks approval | P2 / 9 |
| TR-030 | TRD 8.3 / missing | Missing never becomes zero | No assessment model | MISSING | Explicit missing representation | Missing round-trip differs from 0 | P1 / 9 |
| TR-031 | TRD 8.3 / range | Assessment-specific format/range | No validation | MISSING | Academic rules | Rules vary by approved assessment | P2 / 9 |
| TR-032 | TRD 8.3 / corrections | Original/corrected/reason/actor/time retained | No correction model | MISSING | Exception/audit schema | History immutable/attributable | P2 / 9 |
| TR-033 | TRD 8.3 / retry | Reimport does not duplicate/overwrite approved data | No assessment imports | MISSING | Checksums/idempotency/state rules | Same file retry safe/explicit | P2 / 9 |
| TR-034 | TRD 11 / secrets | No credentials in tracked config/client/logs | Baseline `HEAD`/remote contains populated env files and a Group Sync fallback; local remediation removes them from the next index/worktree snapshot | MISMATCH | Rotation/revocation and remote-history handling remain owner-led; never print values | Old values rejected; clean history/current tree/bundle verified | P0 / 1 |
| TR-035 | TRD 11 / service credentials | Privileged credentials server-only with route scope | Local copies are now ignored and scheduled for untracking; service client and route gaps remain | PARTIAL | Verify rotation, deployed bindings and route scope | Clean bundle; every service route scoped | P0 / 1 |
| TR-036 | TRD 11 / database | Review roles/grants/RLS/service privileges together | SQL exists; Group Sync permissive; live state unknown | UNVERIFIED | Authorized live matrix/canonical schema | Anon/auth/service tests match policy | P0 / 2 |
| TR-037 | TRD 11 / documents | Private rubrics/exports in controlled storage | No assessment storage | MISSING | Storage/retention/access decision | Unauthorized file access denied | P1 / 8 |
| TR-038 | TRD 11 / inputs | Server validates API/upload input | Validation in several routes/parsers | PARTIAL | Inconsistent schemas/MIME; Group Sync auth absent | Malformed/type/size tests deny without partial commit | P0 / 6 |
| TR-039 | TRD 11 / audit | Protect/minimize audit records | Audit table/routes/helper; no immutability evidence | PARTIAL | Access/retention/metadata review | Unauthorized read/update/delete denied | P1 / 6 |
| TR-040 | TRD 11 / minimization | Only needed data collected/displayed | Group Sync `select('*')` returns roster/session data | MISMATCH | Approved role projections | Field-level minimum by role | P0 / 2 |
| TR-041 | TRD 11 / environments | Distinct local/test/prod boundaries | Multiple configs and unsafe fallbacks | UNVERIFIED | Confirm bindings/fail-closed behavior | Each env targets intended project | P1 / 1 |
| TR-042 | TRD 11 / real data | Real student data only if approved | Samples/fixtures exist; classification unknown | UNVERIFIED | Data-owner classification/tool approval | Synthetic/approved pilot dataset recorded | P0 / 1 |
| TR-043 | TRD 11 / revocation | Revocation reflected in operations | Partial grant/ad-hoc checks | PARTIAL | Unified semantics | Revocation effective within approved window | P0 / 3 |
| TR-044 | TRD 11 / security events | Investigate failures/privileged anomalies | General logs/audit; no approved monitoring/incident evidence | MISSING | Monitoring/retention/owner | Alert/incident drill yields trace | P1 / 7 |

## UI/UX requirements

| ID | Source | Intended behavior | Evidence | Status | Retrofit and acceptance | Pri / order |
|---|---|---|---|---|---|---|
| UX-001 | Brief 2.1 | Coherent ecosystem/shared cues | Continuum shell, UI package, conditional app links | PARTIAL | Validate terminology/navigation | P2 / 5 |
| UX-002 | Brief 2.2 | Portal orchestrates, does not duplicate domains | Overview/links and limited write-through | PARTIAL | Label/remove ambiguous fixture duplication | P1 / 5 |
| UX-003 | Brief 2.3 | Role-aware task defaults | Effective-access UI and role pages | PARTIAL | Validate role journeys and denial | P1 / 5 |
| UX-004 | Brief 2.4 | Direct-entry parity | Independent entry; authorization differs | MISMATCH | FR-003/TR-011 | P0 / 4 |
| UX-005 | Brief 2.5 | Clear draft/pending/approved/exported/completed status | Status chips and operational states | PARTIAL | Separate unavailable/fixture/manual-transfer/success | P1 / 5 |
| UX-006 | Brief 2.6 | Preview/confirm/review consequential actions | Some dialogs; no assessment flow | PARTIAL | Explicit confirmation/state rules | P1 / 6 |
| UX-007 | Brief 2.7, 9 | Keyboard/focus/contrast/semantics/responsiveness | Component/CSS evidence only | UNVERIFIED | Run keyboard, screen reader, zoom, contrast, device checks | P2 / 7 |
| UX-008 | Brief 4.1-4.2 | Permission-aware top-level IA | Operational shell narrower; presentation has conceptual IA | PARTIAL | Validate before operational claim | P2 / 5 |
| UX-009 | Brief 4.3 | Catalogue shows purpose/tasks/status/access/open behavior | App/service cards | PARTIAL | Complete metadata/evidence labels | P1 / 5 |
| UX-010 | Brief 5.1 | Portal overview/context with truthful dependency states | Operational page and overview API | PARTIAL | Test source-unavailable/maturity states | P1 / 5 |
| UX-011 | Brief 5.2 | Protected Group Sync host lifecycle | Host UI exists; API unprotected | MISMATCH | Security redesign first | P0 / 2 |
| UX-012 | Brief 5.3 | Schedule creation/publication/booking/attendance | Apps/routes exist | PARTIAL | Runtime/ownership/recovery/concurrency tests | P1 / 6 |
| UX-013 | Brief 5.4 | WorkSuite request/approval/conflict/confirmation | UI/routes/migrations | PARTIAL | Scope/state/error tests | P1 / 6 |
| UX-014 | Brief 5.5 | Academic config visibly non-authoritative until approved | BCom workspace and demo fixtures | PARTIAL | BCom only; other schools placeholders | P1 / 5 |
| UX-015 | Brief 5.6, 6.2 | Assessment import/exception/report/approval/export journey | Demo screens only | MISSING | Design after academic decisions | P2 / 8 |
| UX-016 | Brief 6.3, 7 | Errors preserve input, identify issue, provide recovery | Mixed route/UI handling | PARTIAL | Test empty/loading/denied/partial/retry | P1 / 7 |
| UX-017 | Brief 8 | Approved institutional visual system | Design docs/components; standard approval unknown | DECISION REQUIRED | Brand/accessibility owner approval | P2 / 7 |
| UX-018 | Brief 10 | UI reinforces privacy/expiry/denial/scoped access | Partial auth UI; broad Group Sync data | PARTIAL | Minimize fields and unify session/denial states | P0 / 2 |

## Data/schema requirements

| ID | Source | Intended behavior | Evidence | Status | Retrofit and acceptance | Pri / order |
|---|---|---|---|---|---|---|
| DATA-001 | Schema 2.1 | Preserve independent domains/use contracts | Separate apps/routes, shared DB | PARTIAL | Approve physical boundaries/contracts | P1 / 4 |
| DATA-002 | Schema 2.2 | Authoritative owner per entity | Documented but not approved/live-verified | DECISION REQUIRED | ADR-03 entity register | P1 / 4 |
| DATA-003 | Schema 2.3 | Distinguish identity/role/scope/temp grant | `role_v2` plus grants | PARTIAL | Coarse role/incomplete scopes | P1 / 3 |
| DATA-004 | Schema 2.4 | Preserve import/change/version/actor/exception provenance | Audit plus workflow/record links | PARTIAL | Assessment provenance/audit coverage absent | P1 / 6 |
| DATA-005 | Schema 2.5 | Avoid competing authoritative records | CARS boundary documented; table authority unknown | UNVERIFIED | Ownership/contract review | P1 / 4 |
| DATA-006 | Schema 2.6 | Versioned/tested/reversible schema changes | Divergent migration trees/no history proof | MISMATCH | Authority/recovery before migration | P0 / 1 |
| DATA-007 | Schema 4 | Stable users/external subjects/lifecycle | UUID user table/roles | PARTIAL | Provider subject/status incomplete | P1 / 3 |
| DATA-008 | Schema 4.2-4.4 | Scoped time-bounded grants with history | Grants/revoke fields/audit | PARTIAL | Combination/reassignment/null-expiry rules | P1 / 3 |
| DATA-009 | Schema 5 | Registry visibility separate from authorization | Services tables and route checks | PARTIAL | Metadata/owners/contracts incomplete | P1 / 5 |
| DATA-010 | Schema 6 | Academic entities from approved source only | BCom config; no verified source | DECISION REQUIRED | Academic source/ID owner | P1 / 4 |
| DATA-011 | Schema 7 | Limited orchestration state/external references/truthful outcomes | Workflow runs and record links | PARTIAL | Stale/unavailable/idempotency untested | P1 / 5 |
| DATA-012 | Schema 8 | Rubric template/version/generation/document entities | None operational | MISSING | Map/justify after format/migration decisions | P2 / 8 |
| DATA-013 | Schema 9.1-9.5 | Consolidation/import/source/record/exception entities | None operational | MISSING | Academic schema after DATA-010 | P2 / 9 |
| DATA-014 | Schema 9.6-9.7 | Versioned reports/exports/separate transfer state | None operational | MISSING | CARS process/state approval | P2 / 10 |
| DATA-015 | Schema 10 | Protected minimized audit distinct from operational state | Audit/workflow records | PARTIAL | Integrity/retention/denied outcomes | P1 / 6 |
| DATA-016 | Schema 12-14 | Integrity/scoped access/one approved migration process | Some keys/policies; five trees | MISMATCH | Applied history/canonical chain/recovery | P0 / 1 |

## Delivery, operations, and reconciliation requirements

| ID | Source | Intended behavior | Evidence | Status | Required next evidence / acceptance | Pri / order |
|---|---|---|---|---|---|---|
| PLAN-001 | Plan 5.1 | Complete repo/app/shared/test/deploy inventory | Companion inventory document | MATCH | Owner review; deployment claims separate | P0 / 1 |
| PLAN-002 | Plan 5.2 | Identify actual deployments/commits/hosts/DB/config | Conflicting configs; no live access | UNVERIFIED | Signed DevOps map | P0 / 1 |
| PLAN-003 | Plan 5.3 | Identify live schema/grants/policies/functions/history | Repository SQL only | UNVERIFIED | DBA-authorized export/comparison | P0 / 1 |
| PLAN-004 | Plan 5.4-5.5 | Record workflows/defects/roles/dependencies/tests/security | Static deliverables | PARTIAL | Runtime owner validation | P0 / 1 |
| PLAN-005 | Plan 6.1 | Verify/rotate/revoke exposed credentials | Local untracking/fallback removal prepared; baseline remote history still contains values and rotation is unverified | MISMATCH | Incident record, rotation and history decision | P0 / 1 |
| PLAN-006 | Plan 6.2 | Protect Group Sync/codes/RLS/expiry | Current routes/policy contradict target | MISMATCH | Security design and negative tests | P0 / 2 |
| PLAN-007 | Plan 7 | Approve boundaries/registry/contracts/parity | Partial docs/code | PARTIAL | Ownership/contracts/parity evidence | P1 / 4-5 |
| PLAN-008 | Plan 8 | Map schema/ownership/changes/canonical migrations | Five trees/live history unknown | MISMATCH | Canonical migration decision/map | P0 / 1 |
| PLAN-009 | Plan 9 | Stabilize existing apps before expansion | Mixed maturity; Group Sync P0; tests incomplete | PARTIAL | App acceptance suites/defect owners | P1 / 6 |
| PLAN-010 | Plan 10 | Validate real assessment flow then bounded delivery | No approved source/process/service | MISSING | Academic/CARS discovery | P2 / 8-10 |
| PLAN-011 | Plan 12 | Unit/integration/authz/data/E2E/UAT/regression evidence | Some tests; major gaps | PARTIAL | Fill gaps and record environment/results | P1 / 6-10 |
| PLAN-012 | Plan 13 | Deployment/monitoring/backup/support/rollback/approval | Config/docs only | UNVERIFIED | Named owners and rehearsed evidence | P1 / 7 |
| RECON-001 | Alignment 3.2/4 | Built must not imply deployed/validated | Mixed labels/prototype and operational screens | PARTIAL | One capability register | P1 / 1 |
| RECON-002 | Alignment Finding 2 | Portal must not absorb domain ownership | Mostly source-owned routes/tables | PARTIAL | Approve boundaries/remove ambiguity | P1 / 4 |
| RECON-003 | Alignment Finding 3 | Shared identity is not unrestricted access | Inconsistent boundaries | MISMATCH | FR-003/004 | P0 / 2-4 |
| RECON-004 | Alignment Finding 4 | Conceptual schema is not migration-ready | Five trees/live state unknown | MISMATCH | DATA-016/PLAN-008 | P0 / 1 |
| RECON-005 | Alignment Finding 5 | BCom pilot; other schools placeholders | BCom defaults/docs; generic setup permits other codes | PARTIAL | Status language/stakeholder approval | P1 / 5 |
| RECON-006 | Alignment Finding 6 | No unapproved calculations/automatic decisions | No operational assessment engine | MATCH | Preserve invariant in future implementation | P1 / 9-10 |
| RECON-007 | Alignment Finding 7 | Export/manual transfer never implies CARS update | Docs preserve boundary; unrelated WorkSuite UI says “Export CARS” | PARTIAL | Clarify label and future states | P1 / 5 |
| RECON-008 | Alignment Finding 8 | Identity/hosting/database decisions remain separate | No Entra/M365 connector; current Supabase/Vercel code | MATCH | Keep ADR-04/10/11 open | P1 / 1 |
| RECON-009 | Alignment Finding 9 | Security findings stay open until verified | Group Sync/credential findings remain | MISMATCH | Owner/status/verification record | P0 / 1-2 |
| RECON-010 | Prior audit | Group Sync host authorization/session-code security | No auth, `Math.random`, broad reads/mutations | MISMATCH | Immediate containment/design/tests | P0 / 2 |
| RECON-011 | Prior audit | Credential-like files/fallbacks need authorized verification | Local containment prepared; remote history and deployed credential status remain unresolved | MISMATCH | Incident owner verifies/rotates and decides history treatment without printing values | P0 / 1 |
| RECON-012 | Prior audit | Resolve competing backend/deploy/migration locations | Three backend copies/five migration trees/conflicting configs | DECISION REQUIRED | DevOps/DBA establish authority | P0 / 1 |
| RECON-013 | Prior audit | Assessment/CARS workflows missing/unverified | Fixtures/docs only | MISSING | Academic/CARS decisions then bounded build | P2 / 8-10 |
| RECON-014 | Prior audit | Direct API authorization tests required | No Group Sync/security/parity suite | MISSING | Add negative tests after policy decision | P0 / 2-4 |

## Test evidence from this reconciliation

On 29 October 2026, `npm --workspace @afda/backend test -- --runInBand` was run without changing source. Four suites passed and one failed; 18 tests passed. The failing `server/src/routes/bookings.test.ts` suite did not run because its middleware mock did not provide `requireRole`. Passing suites covered grouping logic, roster parsing, Continuum access helpers, and the legacy `server/backend` bookings tests. This is not evidence that route authorization, direct-entry parity, deployments, or live database policies pass.

## Status totals

Counts are per individually listed requirement above.

| Status | Count |
|---|---:|
| MATCH | 3 |
| PARTIAL | 53 |
| MISMATCH | 19 |
| MISSING | 48 |
| UNVERIFIED | 14 |
| DECISION REQUIRED | 6 |
| **Total** | **143** |

## Most consequential conclusions

1. Owner-led credential containment and identification of the active backend/database/migration chain are the first dependencies.
2. Group Sync is an evidenced authorization mismatch: a session code reaches host mutations and broad session/roster reads without authenticated host ownership.
3. Continuum, Schedule, Student Booking, and WorkSuite contain useful implementation, but direct-entry parity and live operational status remain unverified.
4. Assessment/rubric/consolidation/manual-CARS functionality is not operational; current evidence is documentation and demo fixtures.
5. BCom is the only proposed pilot. Other schools remain unvalidated placeholders.
