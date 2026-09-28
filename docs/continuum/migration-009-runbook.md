# Continuum migration 009 runbook

## Purpose

Migration 009 extends the existing Continuum institution, period, workspace, service, activity and handoff schema with the minimum persistent lineage required to show how Continuum arrives at a result:

```text
School workspace setup
→ service enabled for that workspace
→ sanitised action input recorded
→ owning service creates its source record
→ additive source-record link created
→ workflow result and status recorded
→ existing audit log records the actor
```

It does not create a curriculum, assessment engine, gradebook or CARS replacement.

## Preconditions

1. The target Supabase project is active and backed up.
2. The canonical backend `/api/ready` endpoint returns HTTP 200.
3. `venues.building` and `venue_booking_requests.import_source` exist, confirming migration 008.
4. `continuum_institutions`, `continuum_periods`, `continuum_workspaces`, `continuum_services`, `continuum_workspace_services`, `continuum_activities` and `continuum_activity_services` exist.
5. The SQL is reviewed by the database owner.
6. Staging is used before any real pilot data.

## Apply

Open the Supabase SQL Editor for the staging project and run only:

`server/migrations/009_continuum_orchestration.sql`

Do not rerun migrations 001–008 or the earlier Continuum platform migration. Migration 009 is additive and seeds only the three service-registry definitions: Group Sync, Schedule and Spaces & Resources. It does not create an institution, academic period, BCom workspace or fictional users.

## What it creates

| Existing table extended | Responsibility |
| --- | --- |
| `continuum_workspaces` | Adds description, configuration and setup actor metadata |
| `continuum_workspace_services` | Adds configuration, enablement actor and timestamps |

| New table | Responsibility |
| --- | --- |
| `continuum_record_links` | Relationship between a workspace and an existing source-owned record |
| `continuum_workflow_runs` | Sanitised input, status and source-system result lineage |
| `continuum_access_grants` | Time-bound workspace/service capabilities |

The three new tables have RLS enabled with no browser policies. Existing Continuum tables retain their fail-closed RLS configuration. Access is intentionally server-mediated through the canonical API and service role.

## Verify before deployment

Run this in the SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name like 'continuum_%'
order by table_name;

select service_key, lifecycle_status
from public.continuum_services
order by service_key;
```

Expected: ten Continuum tables in total and three service records.

## Deployment order

1. Apply migration 009 to staging.
2. Deploy the canonical `server/` backend.
3. Confirm `/api/ready` returns HTTP 200.
4. Deploy `apps/continuum`.
5. Sign in with a fictional `admin` account.
6. Open **Workspace setup** and create the BCom workspace.
7. Enable Group Sync.
8. Open **Group Sync** and create a traced session.
9. Return to **Workspace setup** and confirm the input, resulting `sync_sessions` record ID and successful workflow status are displayed.
10. Confirm an audit entry exists for the workspace and session actions.

## Failure and rollback approach

Do not drop or truncate tables as an ad hoc rollback. Stop the backend deployment if verification fails, preserve any Continuum rows and use a separately reviewed forward repair migration. Migration 009 does not modify or delete Schedule, Group Sync, WorkSuite or CARS-owned records.
