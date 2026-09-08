# AFDA Continuum — Architecture

## Current Phase 1 architecture

Continuum is an independently deployable Next.js 16 application at `apps/continuum`. It uses `packages/continuum-ui` for shared operational components and local fictional fixtures for all Venture, assessment, Registry and administration views.

```text
Continuum POC (fixtures only)
├── Ventures, people and activity
├── Assessment and Registry story
├── Administration policy preview
└── Configurable links
    ├── Slot Booking
    ├── Student Public
    ├── Group Sync
    └── Venue Booking / WorkSuite

Existing applications ──► canonical server/ API ──► Supabase Auth/PostgreSQL
```

Continuum does not proxy, iframe or absorb the existing applications in Phase 1. Each remains a separate Vercel project with its own routes and authentication assumptions. Missing module URLs fail visibly as “Not configured.”

## Canonical boundaries

- `server/` is the canonical Express/Supabase backend.
- `backend/` and `server/backend/` remain legacy compatibility copies and receive no Continuum work.
- `batches`, `slots`, `sync_sessions` and `sync_participants` are protected contracts.
- WorkSuite is canonical for direct Spaces & Resources requests through `/api/worksuite`; `/api/venues` remains a compatibility workflow.
- The existing `audit_logs` structure is reused later rather than creating a competing audit architecture.

## Proposed production control plane

The production architecture adds a server-owned Continuum API only after migration 008 is resolved and Phase 2 is approved:

1. Supabase Auth establishes user identity.
2. `users.role_v2` supplies the institutional baseline role.
3. time-bound capability grants constrain authority to a Venture and optional assessment;
4. Express routes validate every command and never trust browser-supplied roles;
5. PostgreSQL RLS fails closed using authenticated identity and scope;
6. append-only audit events record grants, assessment transitions and exports;
7. external integrations pass through provider adapters and staged imports.

## Deployment topology

The recommended POC topology is one Vercel project per application. `afda-continuum-poc` uses `apps/continuum` as its Root Directory and links out to the established module domains. It must not reuse an existing project or domain.

A later unified domain may use an explicitly designed gateway or Vercel rewrites, but that is not required for the POC and must not hide independent authentication boundaries.

## Phase 2 decision gates

- Intentionally accept, revise or reject migration 008.
- Remove tracked generated environment files and rotate affected credentials.
- Approve capability ownership and the user lifecycle.
- Approve the Microsoft tenant, consent and minimum Graph permissions.
- Obtain the institution-approved CARS input/output specification.
- Approve staging, backup, RLS, migration and rollback procedures.
