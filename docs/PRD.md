# AFDA Continuum MVP

## Product Requirements Document

### 1. Product Definition

AFDA Continuum is the institutional context and orchestration platform that connects AFDA learning workspaces to independently deployable services.

Continuum is not a replacement for Slot Booking, Group Sync, Venue Booking, CARS, or Microsoft 365. It gives staff one place to configure academic context, discover connected services, manage access, and move into the service that owns the work.

The first MVP proves this model with one configured BCom workspace. Other schools may be added later through the same configuration workflow.

### 2. Product Outcome

A staff member should be able to:

1. Sign in to Continuum.
2. Select an institution, academic period, and school workspace.
3. See the work and services relevant to that workspace.
4. Configure or review a cross-service activity.
5. Open the owning application with the right context.
6. Return to Continuum without losing their place.

A super-admin should be able to configure the platform without editing code.

### 3. Users

#### Super-admin

Configures institution context, academic periods, school workspaces, connected services, users, roles, and permissions.

#### School administrator

Manages a school workspace, its programmes/modules, activities, service connections, and local access.

#### Lecturer or staff member

Uses a workspace to find relevant activities, launch Schedule, Group Sync, or Venue Booking, and review handoff status.

#### Operations user

Manages operational work connected to venues, bookings, and service requests through the owning application.

#### Student

Uses the relevant existing student-facing application. Continuum may provide authenticated context and links, but does not recreate public booking or live grouping flows in MVP.

#### External or temporary user

Receives narrowly scoped access through the owning workflow. Continuum must not expose unrelated workspace data.

### 4. MVP Scope

#### In scope

- Authentication boundary and signed-in user context.
- Institution setup.
- Academic period setup.
- School workspace setup.
- One configured BCom sandbox.
- Programme and module context for BCom.
- Connected application registry.
- Configurable service URLs and return paths.
- Workspace membership and role assignment.
- Role-aware navigation.
- Cross-service activity records and deep links.
- Cross-service task inbox.
- Launching existing applications with context.
- Return-to-Continuum navigation.
- Service health and connection state.
- Audit trail for configuration and access changes.

#### Out of scope for MVP

- Rebuilding batch or slot management inside Continuum.
- Rebuilding student booking inside Continuum.
- Rebuilding real-time group formation inside Continuum.
- Rebuilding venue availability or approval inside Continuum.
- Official marks, enrolment, results, certification, or Registry workflows.
- CARS writeback or Microsoft Graph integration.
- Institution-wide academic schema design.
- Automatic grading calculation.
- A universal LMS content model.
- A fully implemented Admin Hub.

### 5. Existing Application Ownership

| Capability | System of record | Continuum responsibility |
|---|---|---|
| Batches, slots, bookings, attendance | Slot Booking | Context, launch, return path, summary |
| Student booking and cancellation | Student Public | Entry link and workspace context |
| Live group formation and membership | Group Sync | Session context, launch, summary |
| Venues and venue requests | Venue Booking / WorkSuite | Context, request linkage, launch, summary |
| Official academic records | CARS | Boundary only; no write path |
| Collaboration and identity | Microsoft 365 | Proposed connector only |

Continuum must not duplicate mutations owned by these applications.

### 6. Core Concepts

#### Institution

Top-level AFDA context.

Fields:

- Name
- Short name
- Time zone
- Active state
- Logo or identity asset, if supplied

#### Academic period

A period that groups work in time.

Fields:

- Name
- Academic year
- Start date
- End date
- Status: draft, active, closed

#### School workspace

A configurable operating context for a school.

Fields:

- School name
- Short name
- Active period
- Workspace status
- Members
- Programmes
- Connected services

BCom is the first configured workspace. It is not the permanent identity of Continuum.

#### Programme and module

Academic context used to organise activities and launch services. MVP supports configuration and linking; it does not claim to define the final academic model.

#### Connected service

An independently deployed application registered in Continuum.

Fields:

- Service name
- Service type
- Base URL
- Environment
- Owner
- Authentication mode
- Supported deep-link types
- Return URL
- Connection status

#### Activity

A piece of work that may involve one or more services.

Examples:

- A consultation block using Slot Booking and Venue Booking.
- A group formation session using Group Sync.
- A presentation using Slot Booking, Group Sync, and Venue Booking.

Continuum owns the activity context and relationships. The owning application owns its operational records.

#### Workspace membership

A user’s access to a workspace and the role they hold there.

Roles are permissions, not personas shown throughout the interface.

### 7. Primary User Flows

#### 7.1 Super-admin first-run setup

1. Sign in.
2. Create or confirm institution.
3. Create academic period.
4. Create school workspace.
5. Select or create programme/module context.
6. Register existing applications.
7. Configure URLs and return paths.
8. Add workspace administrators.
9. Review setup.
10. Activate workspace.

The setup flow must save progress and allow return to incomplete steps.

#### 7.2 Workspace configuration

1. Open a school workspace.
2. Select the active academic period.
3. Configure programme and module context.
4. Add workspace members.
5. Enable relevant services.
6. Create an activity.
7. Choose which service owns each operational part.
8. Save and open the owning application.

#### 7.3 Staff daily use

1. Open the active workspace.
2. Review assigned tasks and upcoming activities.
3. Open an activity.
4. Launch the relevant service.
5. Complete the task there.
6. Return to the activity in Continuum.
7. See the latest known handoff state.

#### 7.4 Service connection setup

1. Open workspace settings.
2. Choose a service.
3. Enter or select the service URL.
4. Select environment and authentication method.
5. Configure supported deep links.
6. Test the connection.
7. Save the service.
8. Make it available to selected workspaces.

#### 7.5 User and access setup

1. Open workspace members.
2. Invite or select a user.
3. Assign a workspace role.
4. Limit access to the required workspace or activity.
5. Review permissions.
6. Save.

### 8. Product Requirements

#### Identity and access

- Show the current user, institution, workspace, and active period.
- Never use a persona switcher as a substitute for access control.
- Support workspace-scoped roles.
- Make activity-scoped temporary access explicit.
- Do not expose cross-workspace records by default.

#### Navigation

- Persistent workspace context.
- Primary navigation based on user work: Home, Workspaces, Activities, Services, People, Settings.
- Service launches must show the destination and ownership.
- Existing applications must provide a visible return path to Continuum.

#### Configuration

- All platform configuration must be possible through forms.
- Required fields must be validated before activation.
- Draft setup must be resumable.
- Destructive actions require confirmation.
- Configuration changes must be auditable.

#### Cross-service handoffs

- Deep links must carry only approved context identifiers.
- Continuum must not assume that a destination supports a deep link until configured.
- A failed or unavailable service must produce a clear recovery action.
- Return paths must preserve workspace and activity context.
- Continuum must show last-known connection state, not invented live data.

#### Work queues

The home view should show actionable work, not maturity explanations:

- Tasks assigned to the current user.
- Activities needing setup.
- Upcoming activities.
- Service requests awaiting action.
- Failed or incomplete handoffs.

#### Existing app integration

MVP integrations may begin as configured links and handoff contracts. They must not imply live synchronisation until an actual integration exists.

### 9. Success Criteria

- A super-admin can create a new workspace without code changes.
- BCom can be configured as one workspace in an academic period.
- Existing services can be registered and launched from the workspace.
- A staff member can find the correct service for an activity in fewer than three actions.
- A user can return from an existing service to the same Continuum workspace context.
- Workspace access can be granted and revoked without editing source files.
- No page requires users to understand the orchestration model to complete a task.
- The primary home view contains actionable work and configured inputs, not only summary metrics.

### 10. Non-functional Requirements

- WCAG 2.2 AA target.
- Responsive desktop and mobile layouts.
- Keyboard-accessible navigation and forms.
- Visible loading, empty, error, and unavailable-service states.
- No secrets, tokens, production credentials, or tenant identifiers in source.
- Existing protected data contracts remain unchanged.
- Independent deployments remain independently deployable.
- Configuration and permission changes are auditable.

### 11. Release Slices

#### Slice 1: Platform foundation

- Signed-in shell.
- Institution, period, workspace, and member context.
- BCom workspace seed.
- Form-based first-run setup.

#### Slice 2: Connected services

- Service registry.
- URL and return-path configuration.
- Schedule, Group Sync, and Venue Booking launch cards.
- Cross-app return paths.

#### Slice 3: Activities and work queue

- Activity creation.
- Activity-to-service relationships.
- Assigned work queue.
- Deep-link handoff state.

#### Slice 4: Access and governance

- Workspace roles.
- Activity-scoped access.
- Audit history.
- Service health and configuration history.

### 12. Product Language

Use:

- Workspace
- Activity
- Service
- Member
- Setup
- Connect
- Open in Schedule
- Open in Group Sync
- Open in Venue Booking
- Needs your action

Avoid:

- POC status labels in primary user flows.
- Evidence legends.
- Prototype maturity badges on every record.
- Persona language as navigation.
- Explanations of the orchestration model.
- Fictional institutional claims.
- Dashboard metrics without an associated action.
