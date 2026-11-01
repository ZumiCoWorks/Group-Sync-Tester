# Continuum endpoint authorization matrix

**Status:** Sprint 1 review packet (RB-000) with local implementation in progress

**Evidence date:** 1 November 2026

**Scope:** Static route and middleware inspection of `server/`, `backend/`, and their deployment entry points. This document proposes boundaries; it does not authorize a deployment or database change.

## Executive decision

The authenticated Vercel CLI inventory identified `server/` as the root of the active backend project (`afda-core-backend`). That makes `server/` the operational baseline for this matrix. The repository also contains independently deployable `backend/` and `server/backend/` trees. They cannot be treated as harmless copies: `backend/` uses different identity claims and exposes four unauthenticated Continuum routes that operate through a service-role client.

Sprint 1 must therefore do both of the following:

1. enforce the approved policy in `server/`; and
2. make the non-canonical trees non-deployable or bring them to explicit policy parity before any release.

## Boundary vocabulary

| Boundary | Meaning |
|---|---|
| Public-minimal | No login, no personal or unpublished data, deliberately small projection, abuse controls where state is changed. |
| Participant-self | Authenticated participant, or a short-lived signed capability scoped to one participant/resource and action. |
| Host-owner | Authenticated session/batch owner or an explicit scoped grant; a join/session code alone is not host authority. |
| Staff-scoped | Authenticated staff plus a verified resource, workspace, department, or capability relationship. |
| Ops-scoped | Authenticated operations role plus verified ownership of the affected department/venue/resource. |
| Platform-admin | Authenticated platform administrator for cross-workspace configuration. |
| Disabled | Not exposed in the target environment. |

`verifyToken` proves identity. `requireRole` is only a coarse role check; it does not prove ownership or object scope. Every row marked **scope missing** requires an object-level check in addition to middleware.

## Identity baselines

| Tree | Current identity source | Current role source | Assessment |
|---|---|---|---|
| `server/` | Supabase `auth.getUser(token)` | `public.users.role_v2`; ad-hoc expiry checked | Canonical candidate. Fails closed for a missing user or role, but null ad-hoc expiry policy remains an owner decision. |
| `backend/` | Supabase `auth.getUser(token)` | `app_metadata.role`, then `user_metadata.role`, defaulting to `student` | Divergent and unsafe for parity: it does not use the canonical database role or access-expiry rule. |
| Public Group Sync routes | No verified identity | None | Critical boundary gap for all host mutations. |

## Active `server/` route matrix

### Platform, identity, and placeholders

| Method and path | Current boundary | Current scope | Proposed boundary | Required Sprint 1 action |
|---|---|---|---|---|
| `GET /api/health` | Public | Process status only | Public-minimal | Keep response free of configuration, commit, and dependency detail. |
| `GET /api/ready` | Public; service-role DB probe | Returns coarse database state and environment | Public-minimal, or private detailed probe | Keep public response coarse; send diagnostic detail only to logs/monitoring. |
| `GET /api/auth/verify` | Token verified inside handler; staff allow-list | Self, but may insert a missing user record | Participant-self for profile read; provisioning must be separate | Remove implicit provisioning from verification or put it behind an approved provisioning workflow. |
| `ANY /api/audit` | Public `501` placeholder | No data | Disabled | Remove the placeholder from production routing or keep a data-free `404/501`; never add data without Platform-admin policy. |

### Schedule batches

| Method and path | Current boundary | Current scope | Proposed boundary | Required Sprint 1 action |
|---|---|---|---|---|
| `GET /api/batches` | Public | Calls `listBatches(status)` without enforcing a public status | Public-minimal for published catalogue; Staff-scoped for drafts/all states | Split public and internal listings or force a published-only public query. |
| `GET /api/batches/internal/:batchId` | Staff-role allow-list | **Scope missing** | Staff-scoped | Require owner or explicit Schedule capability for the batch. |
| `GET /api/batches/:batchId` | Public | Status gate; returns published, pending-approval, closed, or archived batch | Public-minimal | Define the exact public states and projection; pending approval should not be assumed public. |
| `GET /api/batches/:batchId/slots` | Public | Published/closed/archived batch gate | Public-minimal | Return bookable/public slot fields only and decide whether archived slots remain public. |
| `GET /api/batches/:batchId/roster?token=…` | Bearer-like query token | Exact token match; no expiry; returns slots and booking records | Host-owner or short-lived signed roster capability | Add expiry/revocation, avoid query-string secrets, and minimize participant fields. |
| `GET /api/batches/:batchId/bookings-public` | Public | Published batch; returns confirmed booking objects | Participant-self or aggregated public availability | Remove personal booking records from the public response; return occupancy only unless an approved use case says otherwise. |
| `POST /api/batches` | Staff-role allow-list | Creator recorded | Staff-scoped | Require Schedule create capability and preserve creator ownership. |
| `PUT /api/batches/:batchId` | Staff-role allow-list | **Scope missing** | Host-owner/Staff-scoped | Verify batch owner or delegated Schedule edit capability. |
| `POST /api/batches/:batchId/publish` | Staff-role allow-list | **Scope missing** | Host-owner/Staff-scoped | Verify owner/capability and audit allow/deny outcome. |
| `POST /api/batches/:batchId/close` | Staff-role allow-list | **Scope missing** | Host-owner/Staff-scoped | Verify owner/capability and audit allow/deny outcome. |

### Bookings, imports, exports, and audit records

| Method and path | Current boundary | Current scope | Proposed boundary | Required Sprint 1 action |
|---|---|---|---|---|
| `POST /api/bookings` | Public state change | Slot identifier plus submitted student details | Participant-self; public only if explicitly approved | Bind to an authenticated/signed participant action; add rate and replay controls and return a minimal receipt. |
| `GET /api/bookings?batchId=…` | Broad staff/ops role allow-list | **Scope missing** | Host-owner/Staff-scoped | Require access to the referenced batch and minimize fields. |
| `DELETE /api/bookings/:bookingId` | Broad staff/ops role allow-list | **Scope missing** | Host-owner/Staff-scoped; participant cancellation through a separate self route | Resolve booking to batch before mutation and enforce action-specific scope. |
| `PUT /api/bookings/:bookingId` | Broad staff/ops role allow-list | **Scope missing** | Host-owner/Staff-scoped | Resolve booking to batch and require attendance-management capability. |
| `POST /api/imports` | Staff-role allow-list | Batch existence only; **scope missing** | Host-owner/Staff-scoped | Require batch import capability; retain file limits and add content/concurrency tests. |
| `GET /api/exports?batchId=…` | Broad staff/ops role allow-list | Batch existence only; **scope missing** | Host-owner/Staff-scoped | Require batch export capability and audit the export without logging exported data. |
| `GET /api/audit-logs?batchId=…` | Broad staff/ops role allow-list | **Scope missing** | Host-owner/Staff-scoped, with narrower audit-reader role if approved | Require batch scope and redact sensitive audit details. |
| `GET /api/audit-logs/export?batchId=…` | Broad staff/ops role allow-list | **Scope missing** | Host-owner/Staff-scoped plus export capability | Apply the same scope as audit read and record the export event. |

### Venue API

| Method and path | Current boundary | Current scope | Proposed boundary | Required Sprint 1 action |
|---|---|---|---|---|
| `GET /api/venues` | Staff/ops role allow-list | All venues | Staff-scoped directory | Confirm approved contact/facility fields and visibility rules. |
| `GET /api/venues/requests` | Staff/ops role allow-list | Intended requester filtering checks obsolete `staff`/`lecturer` role names; current tutor roles can receive all requests | Requester-self or Ops-scoped | Fix role vocabulary and enforce requester/department scope in the query. |
| `POST /api/venues/requests` | Staff/ops role allow-list | Requester recorded; batch ownership not checked | Staff-scoped | Verify requester may act on the batch and may request the venue. |
| `POST /api/venues/requests/:requestId/approve` | Ops/admin role allow-list | **Department/venue scope missing** | Ops-scoped | Verify the operator owns the venue/department and the request is pending; handle conflicts atomically. |
| `POST /api/venues/requests/:requestId/decline` | Ops/admin role allow-list | **Department/venue scope missing** | Ops-scoped | Apply the same owner and state checks as approval. |
| `GET /api/venues/:venueId` | Staff/ops role allow-list | Any venue | Staff-scoped | Apply venue visibility and approved-field projection. |
| `POST /api/venues` | Ops/admin role allow-list | Creator becomes ops owner | Ops-scoped or Platform-admin | Confirm whether department ops may create venues or only platform administrators may. |
| `PUT /api/venues/:venueId` | Ops/admin role allow-list | **Owner scope missing** | Ops-scoped | Verify `ops_owner_id` or department authority before update. |

### WorkSuite venue workflow

| Method and path | Current boundary | Current scope | Proposed boundary | Required Sprint 1 action |
|---|---|---|---|---|
| `GET /api/worksuite/venues` | Authenticated user | Shared venues or user's department; admin sees all | Participant-self/Staff-scoped | Retain fail-closed department lookup and define the admin exception. |
| `GET /api/worksuite/my-requests` | Authenticated user | Requester ID equals current user | Participant-self | Retain and add cross-user denial tests. |
| `POST /api/worksuite/requests` | Authenticated user | Requester ID and department derived from current user | Participant-self | Validate venue visibility, times, overlap policy, and request limits. |
| `GET /api/worksuite/requests` | Ops/admin role allow-list | Non-admin list filtered to operator department | Ops-scoped | Deny non-admin operators with no department rather than broadening the result. |
| `POST /api/worksuite/requests/:id/approve` | Ops/admin role allow-list | Comment explicitly notes department verification is absent | Ops-scoped | Fetch request/venue first, verify department ownership, then mutate atomically. |
| `POST /api/worksuite/requests/:id/decline` | Ops/admin role allow-list | **Department verification absent** | Ops-scoped | Apply the same owner and state checks as approval. |
| `POST /api/worksuite/importer/upload` | Ops/admin role allow-list | Can create shared venues and approved requests across supplied building | Platform-admin or explicitly scoped timetable importer | Define import authority, validate every row, cap payload size, make commit idempotent, and audit preview/commit separately. |

### Group Sync

| Method and path | Current boundary | Current scope | Proposed boundary | Required Sprint 1 action |
|---|---|---|---|---|
| `POST /api/group-sync/session` | Working tree: staff token required; `host_id` derived from token | Host identity recorded | Host-owner | Local guard implemented; rate limiting and non-production verification remain. |
| `GET /api/group-sync/session/:code` | Working tree: public discovery or participant capability | Public projection removes host, roster, groups and participants; participant view returns only the participant's group | Public-minimal discovery or Participant-self | Local projection implemented; replace participant UUID capability with approved signed/expiring model if required. |
| `GET /api/group-sync/session/:code/host` | Working tree: authenticated host/admin | Host ownership checked; full host projection | Host-owner | Local route implemented; add audit and non-production verification. |
| `POST /api/group-sync/session/:code/join` | Public state change | Student-number replay is idempotent; minimal response | Participant-self or tightly controlled public join | Local minimization implemented; identity decision, distributed attempt limits and expiry remain. |
| `POST /api/group-sync/session/:code/group` | Working tree: token plus host/admin check | Session ownership checked | Host-owner | Local guard implemented; audit and staging denial tests remain. |
| `POST /api/group-sync/session/:code/end` | Working tree: token plus host/admin check | Session ownership checked; repeated end is idempotent | Host-owner | Local guard implemented; audit outcome remains. |
| `POST /api/group-sync/session/:code/upload` | Working tree: authentication occurs before file parsing | Session ownership checked | Host-owner | Local guard implemented; MIME/row/formula limits and staging tests remain. |
| `POST /api/group-sync/session/:code/reset` | Working tree: token plus host/admin check | Session ownership and open-state checked | Host-owner | Local guard implemented; audit reset remains. |
| `PATCH /api/group-sync/session/:code` | Working tree: token plus host/admin check | Whitelisted name/groups update with size bounds | Host-owner | Replaces frontend direct table updates; strengthen group schema validation as contract stabilizes. |
| `DELETE /api/group-sync/session/:code/participants/:participantId` | Working tree: token plus host/admin check | Participant must belong to session | Host-owner | Replaces frontend direct deletion; make participant/group cleanup transactional if schema work is approved. |
| `POST /api/group-sync/session/:code/populate` | Working tree: authenticated host/admin and explicit non-production flag | Session ownership checked | Disabled in production; Host-owner/admin in approved test environments | Production denial implemented; retain only if the test/demo use case is approved. |

### Continuum orchestration

All `server/` Continuum routes first run `verifyToken` and the staff-role allow-list.

| Method and path | Current boundary | Current scope | Proposed boundary | Required Sprint 1 action |
|---|---|---|---|---|
| `GET /api/continuum/overview` | Authenticated staff | Non-admin links/workspaces filtered by active own grants; admin sees all | Staff-scoped | Retain; add expired/revoked/cross-workspace tests and minimize each source projection. |
| `POST /api/continuum/workspaces` | Admin | Global admin check | Platform-admin | Retain; validate institutional ownership and audit denial as well as success. |
| `POST /api/continuum/workspaces/:workspaceId/services` | Admin | Global admin check | Platform-admin | Retain; verify service and workspace are active and compatible. |
| `POST /api/continuum/workspaces/:workspaceId/access-grants` | Admin | Global admin check | Platform-admin or delegated grant-admin after policy approval | Retain admin-only for Sprint 1; test expiry, service scope, and ineligible roles. |
| `POST /api/continuum/access-grants/:grantId/revoke` | Admin | Global admin check | Platform-admin or delegated grant-admin after policy approval | Retain admin-only for Sprint 1; make revocation idempotent. |
| `POST /api/continuum/group-sync/sessions` | Staff plus active workspace/service capability | Host ID derived from current user | Host-owner/Staff-scoped | Use this as the reference pattern for direct Group Sync parity. |
| `POST /api/continuum/group-sync/sessions/:sessionId/link` | Staff plus active workspace/service capability | Workspace scope checked; source-session ownership is not explicit | Host-owner/Staff-scoped | Verify the user owns or is delegated authority over the source session. |
| `POST /api/continuum/schedule/batches/:batchId/link` | Staff plus active workspace/service capability | Workspace scope checked; source-batch ownership is not explicit | Host-owner/Staff-scoped | Verify source batch ownership/capability and cross-workspace denial. |

## `backend/` divergence and complete route coverage

The `backend/` tree declares 44 request handlers. For routes with the same method/path as `server/`, the corresponding row above applies, with one additional blocker: `backend/` derives roles from token metadata (`staff`, `lecturer`, `admin`, `ops`) rather than `public.users.role_v2`. Those matching route groups are:

- platform: `GET /api/health`, `GET /api/ready`, and `ANY /api/audit`;
- identity: `GET /api/auth/verify`;
- all ten `/api/batches` rows;
- `POST /api/bookings`, `GET /api/bookings`, `DELETE /api/bookings/:bookingId`, and `PUT /api/bookings/:bookingId`;
- `POST /api/imports`, `GET /api/exports`, both `/api/audit-logs` rows;
- all eight `/api/venues` rows; and
- all eight `/api/group-sync` rows.

The remaining `backend/`-only routes and missing active-tree routes are below.

| Method and path | Present in | Current boundary | Proposed boundary/disposition |
|---|---|---|---|
| `POST /api/bookings/lookup` | `backend/` only | Public lookup using submitted booking identifiers | Participant-self using a short-lived signed capability; reconcile or explicitly retire before canonicalization. |
| `POST /api/bookings/cancel` | `backend/` only | Public cancellation using submitted identifiers | Participant-self with replay-resistant cancellation authority; reconcile or explicitly retire. |
| `POST /api/continuum/bootstrap` | `backend/` only | **Public privileged mutation** through service-role client | Disabled immediately in every deployable target; any bootstrap must be Platform-admin and non-production/one-time controlled. |
| `GET /api/continuum/workspaces/:workspaceId/activities` | `backend/` only | **Public cross-workspace read** | Staff-scoped with workspace grant, or retire with the legacy tree. |
| `POST /api/continuum/workspaces/:workspaceId/activities` | `backend/` only | **Public privileged mutation** | Staff-scoped with workspace capability, or retire with the legacy tree. |
| `GET /api/continuum/services` | `backend/` only | Public service catalogue | Public-minimal only if intentionally public; otherwise authenticated catalogue. |
| All seven `/api/worksuite` routes | `server/` only | See active matrix | Confirm `server/` remains canonical; do not silently lose WorkSuite by switching trees. |

`server/backend/` is a third package/deployment configuration. Its source was not selected as canonical by the workspace or the observed Vercel root. Sprint 1 should mark it archived/non-deployable or prove that it is generated from the canonical tree.

## Approval register

No source implementation should begin until the named owner records a decision for each item.

| Decision | Recommended default | Required owner | Status |
|---|---|---|---|
| Canonical backend tree | `server/`; archive or block deployment of `backend/` and `server/backend/` | DevOps/platform | Pending written confirmation |
| Group Sync join model | Authenticated participant where possible; otherwise short-lived, rate-limited join capability with minimal discovery | Security + Group Sync owner | Pending |
| Group Sync host authority | Supabase-authenticated `host_id` or explicit active delegation; session code never sufficient | Security + Group Sync owner | Pending |
| Group Sync lifecycle | Explicit lobby/active/ended expiry and revocation; exact durations configured, not hard-coded until approved | Security + product | Pending |
| Public Schedule data | Published catalogue and availability only; no public booking PII | Privacy + Schedule owner | Pending |
| Staff object scope | Creator/owner or explicit workspace/service capability; role alone is insufficient | Security + app owners | Pending |
| Venue operations scope | Department/venue ownership required even for ops role; admin exception explicit and audited | Security + WorkSuite owner | Pending |
| Admin semantics | Platform administration does not automatically grant unrestricted academic-record access | AFDA IT/security | Pending |

## RB-000 acceptance checklist

- [x] Every declared `server/` handler is represented.
- [x] Every declared `backend/` handler is represented directly or by an explicitly enumerated matching-route group.
- [x] `server/`, `backend/`, and `server/backend/` deployment divergence is recorded.
- [x] Current middleware is separated from object-level authorization.
- [x] Public, participant, host, staff, ops, and platform-admin boundaries are proposed.
- [ ] Security owner approves or amends the proposed boundaries.
- [ ] App owners approve object ownership rules.
- [ ] DevOps confirms canonical and disabled deployment targets in writing.
- [ ] Approved decisions are converted into tests before implementation.
