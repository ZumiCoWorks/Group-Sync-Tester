# AFDA Continuum — Roles and Capabilities

## Authority model

Identity, institutional role and scoped authority are separate controls:

```text
Supabase Auth identity
        +
users.role_v2 baseline role
        +
time-bound Venture / assessment capabilities
        =
permitted server action
```

The canonical baseline roles remain `student`, `tutor_junior`, `tutor_senior`, `lecturer`, `adhoc`, `ops_venue_admin` and `admin`. Registry is not added as a role. Registry-capable staff use an approved existing baseline, currently represented by Admin in the fixture, plus `registry_review` and/or `export_authority`.

## Proposed capability ownership

| Capability | Typical assignee | Scope | Approval owner |
| --- | --- | --- | --- |
| `venture_member` | Student or staff | Venture | Venture owner |
| `assessor` / `lead_assessor` | Tutor or lecturer | Assessment | Academic owner |
| `moderator` | Lecturer | Assessment | Programme owner |
| `finaliser` | Authorised tutor/lecturer | Assessment | Academic owner |
| `release_authority` | Lecturer/programme authority | Assessment | Programme owner |
| `registry_review` | Registry-capable staff | Period/Venture | Registry owner |
| `export_authority` | Registry-capable staff | Export batch | Registry owner |
| `venue_approver` | Operations admin | Department/venue | Operations owner |

## Administrative controls

- Grant creation and revocation occur through server-only commands.
- Every grant records grantor, reason, scope, start, expiry and status.
- An administrator cannot grant capabilities outside their delegated boundary.
- Expiry is evaluated on every protected request.
- Result submission, finalisation, release, certification and export remain separate actions.
- High-impact Registry and role changes require an audit event and, where approved, dual review.
- Direct database editing is an emergency operation, not a normal administration workflow.

## User lifecycle

- Joiner: identity created, baseline role verified, minimum scope assigned.
- Mover: old scope revoked before new authority becomes active.
- Leaver: sessions revoked, grants expired and owned work reassigned.
- Ad hoc: fixed expiry is mandatory and access is limited to the assigned evidence.
- Quarterly review: platform, academic, Registry and Operations owners attest active access.

The Phase 1 persona switcher is presentation-only and is never accepted as authentication evidence.
