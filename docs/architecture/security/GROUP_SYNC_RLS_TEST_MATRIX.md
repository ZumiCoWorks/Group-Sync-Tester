# Group Sync RLS Access Test Matrix

**Status:** DRAFT — NON-PRODUCTION ONLY

**Dependency:** Approved [`GROUP_SYNC_RLS_REMEDIATION.md`](GROUP_SYNC_RLS_REMEDIATION.md)

Use a dedicated non-production Supabase project and synthetic sessions/participants. Record environment, application commit, migration identifier, tester, timestamp, request ID, status, and redacted result for every test. Never put the `service_role` key in a browser, command line, screenshot, test fixture, or evidence attachment.

## Direct database boundary

For direct REST tests, use only the environment's publishable key and a synthetic test-user JWT obtained through the normal sign-in flow. A denial passes when the request is non-successful and the before/after row state is unchanged; do not require one exact `401`/`403` status across PostgREST versions.

| ID | Principal | Channel | Operation | Expected after remediation |
|---|---|---|---|---|
| RLS-ANON-01 | Anonymous | Supabase REST | Select `sync_sessions` | Denied; no session or roster fields returned |
| RLS-ANON-02 | Anonymous | Supabase REST | Insert/update/delete `sync_sessions` | Denied; row state unchanged |
| RLS-ANON-03 | Anonymous | Supabase REST | Select `sync_participants` | Denied; no participant fields returned |
| RLS-ANON-04 | Anonymous | Supabase REST | Insert/update/delete `sync_participants` | Denied; row state unchanged |
| RLS-AUTH-01 | Authenticated test user | Supabase REST | Select either table | Denied; no fields returned |
| RLS-AUTH-02 | Authenticated test user | Supabase REST | Insert/update/delete either table | Denied; row state unchanged |
| RLS-RT-01 | Anonymous browser role | Supabase Realtime | Subscribe to either table, then perform an API mutation | No table change event delivered |
| RLS-RT-02 | Authenticated browser role | Supabase Realtime | Subscribe to either table, then perform an API mutation | No table change event delivered |

Do not test direct service-role access with ad hoc `curl` commands. The DBA may run a transaction-scoped console check in the approved secret-bearing environment, but release evidence should prove service-role access through the backend API and its server-side integration tests.

## API authorization and service-role continuity

| ID | Caller | API operation | Expected result |
|---|---|---|---|
| API-PUBLIC-01 | Anonymous | Discover a valid session code | Approved minimal session projection only |
| API-PUBLIC-02 | Anonymous | Join with valid synthetic participant data | Success/idempotent result with approved participant projection |
| API-PUBLIC-03 | Anonymous | Query an unknown code | Generic not-found result; no enumeration data |
| API-HOST-01 | Anonymous | Create, group, upload, reset, populate, or end | `401`; no mutation |
| API-HOST-02 | Authenticated non-owner | Host mutation on another host's session | `403` or non-enumerating `404`; no mutation |
| API-HOST-03 | Authenticated owner | Create and perform each approved host mutation | Success; actor/resource/outcome audited |
| API-HOST-04 | Participant capability | Read its session state | Own/approved group fields only; no full roster |
| API-HOST-05 | Participant capability | Attempt a host mutation | Denied; no mutation |
| API-DEMO-01 | Any caller in production-mode config | Demo populate route | `403` or `404`; no mutation |
| API-CONT-01 | Authorized Continuum caller | Create/link approved Group Sync workspace | Success through backend; no browser table access |
| API-CONT-02 | Unauthorized Continuum caller | Create/link Group Sync workspace | Denied consistently with direct entry |
| API-SVC-01 | Canonical backend | Complete create/join/read/group/end lifecycle | All expected backend operations succeed, proving server-side database access |
| API-SVC-02 | Canonical backend | Health/readiness and database-backed route checks | No database permission errors |
| API-LEGACY-01 | External caller | Probe legacy `backend/` Group Sync paths | Absent or routed to canonical guarded implementation |

## Data and audit assertions

| ID | Assertion | Pass condition |
|---|---|---|
| DATA-01 | Denied mutations preserve state | Transactional before/after counts and synthetic row hashes match |
| DATA-02 | Public discovery is minimized | No roster, student number, host ID, internal timestamps, or raw database row |
| DATA-03 | Participant read is scoped | Only self and approved group information is returned |
| DATA-04 | Host read uses explicit projection | Only owner-approved roster fields are returned |
| AUDIT-01 | Successful consequential host actions are logged | Actor, action, resource, outcome, and timestamp present |
| AUDIT-02 | Logs contain no credentials or roster payloads | Redacted log review passes |
| AUDIT-03 | Denied-action coverage matches approved policy | Required denials are present without sensitive request content |

## Release acceptance

The change fails if any anonymous/authenticated direct operation succeeds, any Realtime table event is delivered, backend service-role operations break, a response exposes an unapproved field, the legacy backend remains routable, or evidence cannot be tied to one environment and commit. Production remains blocked until every required owner signs the remediation record.
