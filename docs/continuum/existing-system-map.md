# AFDA Continuum — Existing System Map

## Product boundary

```text
Pre-Continuum sources
├── Microsoft 365 / Teams (not connected in the POC)
├── CARS roster and result spreadsheets
├── Schedule batches and slots
├── Student bookings
├── Group Sync sessions
└── WorkSuite venue requests
          │
          ▼
Continuum
├── Production Ventures
├── People, membership and scoped capabilities
├── Provider-neutral external references and imports
├── Teams-sourced and native assessments
├── Finalisation, release and certification states
├── Existing-module mappings
└── Immutable audit lineage
          │
          ▼
Post-Continuum
├── Registry readiness review
├── Configurable CARS-style preview
├── Versioned CSV/XLSX export batches
└── Manual CARS import confirmation
```

Continuum does not replace Teams or write directly to CARS in this POC.

## Runtime topology

```text
Continuum shell ───────┐
Slot Booking ─────────┤
Student Public ───────┤ HTTPS/JSON
Group Sync ───────────┼──────────────► server/ Express API ─────► Supabase PostgreSQL/Auth
Venue Booking ────────┤
Legacy app ───────────┘
```

Every existing application remains independently deployable. Continuum uses authenticated deep links and common navigation instead of iframes until component-level consolidation is safe.

## Existing record relationships

```text
users
├── batches ──► slots ──► bookings
├── venue_booking_requests ──► venues
├── sync_sessions ──► sync_participants
├── import_jobs
└── audit_logs
```

Existing direct links remain owned by their current modules. A later approved Continuum persistence phase proposes:

```text
ventures
├── venture_members ──► users
├── venture_schedule_mappings ──► batches
├── venture_group_sync_mappings ──► sync_sessions
├── venture_venue_request_mappings ──► venue_booking_requests
├── assessments ──► submissions ──► evaluations/results
├── content_items
├── meetings
├── external_references / entity_mappings
├── capability_grants
├── audit_logs (reused with Continuum action conventions)
└── export_batches
```

No `venture_id` column is added to protected existing tables.

## Route boundaries

- Schedule staff: existing Slot Booking deployment and `/api/batches` family.
- Schedule student: existing Student Public deployment and anonymous published-batch APIs.
- Groups: existing Group Sync deployment and `/api/group-sync`.
- Spaces & Resources: WorkSuite UI and `/api/worksuite`.
- Legacy venue compatibility: `/api/venues` remains available.
- Continuum domain: fixture-only routes in Phase 1; later `/api/continuum` routes and additive database tables remain proposals pending schema review.

## Identity and authority

Supabase Auth establishes identity. `users.role_v2` establishes a baseline institutional role. Continuum capability grants then restrict actions to a venture and, optionally, an assessment.

Broad role alone does not grant assessment authority. Finalisation, release, certification and export are distinct permissions and state transitions.

## Provider boundaries

The Microsoft boundary is an adapter interface with mock and file-import implementations. A Graph adapter remains disabled until AFDA supplies tenant configuration, consent and approved permissions.

Core records use source metadata such as `source_type`, `external_id`, `external_url`, `last_synced_at`, `sync_status` and a payload reference. No core domain table is named after Teams.

## Temporary integration boundaries

Existing modules are not merged into the Continuum Next.js bundle during this POC because they have separate authentication assumptions, deployment roots and visual systems. Continuum provides contextual status and configurable deep links. This avoids duplicating business logic and preserves current URLs.
