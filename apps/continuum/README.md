# AFDA Continuum

Continuum is the authenticated orchestration application for AFDA's shared operational services. It provides explicit school-workspace setup, service enablement, source-record lineage and governed handoffs without taking ownership away from Schedule, Group Sync, WorkSuite or CARS.

## Local setup

From the repository root:

```bash
cp apps/continuum/.env.example apps/continuum/.env.local
npm --workspace @afda/continuum run dev
```

Populate the local file with the approved Supabase browser credentials, canonical backend URL and existing application URLs. Never commit credentials.

## Routes

- `/` — authenticated operational Continuum interface;
- `/presentation` — fictional conference prototype;
- `/presentation/deck` — presentation deck;
- `/activities/[activityId]` — presentation activity detail.

## Data ownership

- Schedule owns `batches`, `slots` and `bookings`.
- Group Sync owns `sync_sessions` and `sync_participants`.
- WorkSuite owns `venue_booking_requests`.
- Continuum owns workspace configuration, enabled-service relationships and input-to-result lineage.
- CARS remains outside this implementation.

## Verification

```bash
npm --workspace @afda/continuum run type-check
npm --workspace @afda/continuum run lint
npm --workspace @afda/continuum run build
npm --workspace @afda/backend run build
```

Migration and rollout instructions are in `docs/continuum/migration-009-runbook.md`.
