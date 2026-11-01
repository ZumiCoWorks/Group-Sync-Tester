# AFDA Continuum MVP

## Information Architecture

### 1. IA Principles

1. Organise the product around user work, not the internal orchestration model.
2. Keep institution and workspace context persistent but quiet.
3. Let users configure context before launching services.
4. Use existing applications for domain operations they already own.
5. Make service handoffs explicit and reversible.
6. Show only the role-relevant navigation for the signed-in user.
7. Treat BCom as one workspace inside the platform, not as the product identity.

### 2. Global Context

Every authenticated page has access to:

- Current user
- Institution
- Current school workspace
- Active academic period
- Workspace role
- Notifications or assigned work

The context bar should allow:

- Switch workspace
- Switch academic period where permitted
- Open account settings
- Sign out

It should not expose all possible personas or explain permissions on every page.

### 3. Primary Navigation

#### Home

The user’s operational start page.

Contains:

- Assigned work
- Upcoming activities
- Recent workspaces or activities
- Service notices
- Quick actions relevant to the role

#### Workspaces

Manage or enter school workspaces.

Contains:

- My workspaces
- All workspaces for authorised admins
- Workspace creation
- Workspace settings
- Workspace members
- Active period

#### Activities

Cross-service work organised by an academic or operational objective.

Contains:

- All activities
- My activities
- Upcoming
- Needs action
- Completed
- Activity creation

#### Services

Connected applications available to the current workspace.

Contains:

- Schedule
- Group Sync
- Venue Booking / Spaces
- Future services
- Service connection settings for admins
- Service health and access state

#### People

Workspace membership and access.

Contains:

- Members
- Invitations
- Roles
- Temporary access
- Activity access

#### Settings

Configuration owned by Continuum.

Contains:

- Institution
- Academic periods
- Workspace configuration
- Programme and module context
- Connected services
- Permissions
- Audit history

### 4. Role-Aware Navigation

#### Super-admin

- Home
- Workspaces
- Activities
- Services
- People
- Settings

#### School administrator

- Home
- Workspace
- Activities
- Services
- People
- Workspace settings

#### Lecturer or staff

- Home
- My workspace
- My activities
- Services
- Profile

#### Operations user

- Home
- Operational activities
- Services
- Assigned requests
- Profile

#### Student

Continuum should provide only the authenticated context and relevant entry points. Student domain flows remain in Student Public or other existing applications.

### 5. Route Structure

```text
/
  Home

/workspaces
  Workspace list

/workspaces/new
  Create workspace

/workspaces/:workspaceId
  Workspace home

/workspaces/:workspaceId/overview
  Workspace overview

/workspaces/:workspaceId/activities
  Workspace activities

/workspaces/:workspaceId/services
  Workspace connected services

/workspaces/:workspaceId/people
  Workspace members

/workspaces/:workspaceId/settings
  Workspace settings

/periods
  Academic period list

/periods/new
  Create academic period

/periods/:periodId
  Academic period overview

/activities
  Cross-workspace activity list

/activities/new
  Create activity

/activities/:activityId
  Activity overview and handoffs

/activities/:activityId/setup
  Configure activity context

/activities/:activityId/access
  Activity-scoped members

/services
  Available and connected services

/services/:serviceId
  Service overview

/services/:serviceId/settings
  Service connection settings

/services/:serviceId/launch
  Handoff confirmation and launch

/people
  People across authorised workspaces

/people/invitations
  Invitations

/people/roles
  Role management

/settings
  Platform settings

/settings/institution
  Institution settings

/settings/periods
  Academic period settings

/settings/services
  Service registry settings

/settings/audit
  Configuration and access audit
```

### 6. Workspace IA

The workspace is the primary container for daily use.

```text
Workspace
├── Overview
├── Activities
│   ├── All
│   ├── Needs action
│   ├── Upcoming
│   └── Completed
├── Modules
│   ├── Programme context
│   ├── Module list
│   └── Module detail
├── Services
│   ├── Schedule
│   ├── Group Sync
│   ├── Venue Booking
│   └── Service settings
├── People
│   ├── Members
│   ├── Invitations
│   └── Access
└── Settings
    ├── Workspace details
    ├── Academic period
    ├── Programme and modules
    └── Connected services
```

### 7. Activity IA

An activity is the main orchestration object exposed to users.

```text
Activity
├── Overview
│   ├── Purpose
│   ├── Workspace and module
│   ├── Dates
│   ├── Owner
│   └── Current status
├── Participants
├── Services
│   ├── Schedule handoff
│   ├── Group Sync handoff
│   └── Venue Booking handoff
├── Tasks
├── Files or links
└── Activity settings
```

The activity page should answer:

- What is this work?
- Who owns it?
- What needs to happen next?
- Which service owns the next action?
- What context will be sent when the user opens that service?
- What happened after the user returned?

### 8. Super-admin Setup IA

The first-run setup is a guided configuration flow, not a dashboard.

```text
Setup
├── Welcome
├── Institution
│   ├── Name
│   ├── Time zone
│   └── Identity
├── Academic period
│   ├── Name
│   ├── Year
│   ├── Start date
│   └── End date
├── First workspace
│   ├── School name
│   ├── Workspace name
│   ├── Active period
│   └── Administrator
├── Programme context
│   ├── Programme
│   └── Modules
├── Connected services
│   ├── Schedule URL
│   ├── Group Sync URL
│   ├── Venue Booking URL
│   └── Return path test
├── People and access
│   ├── Invite administrators
│   ├── Assign roles
│   └── Set workspace scope
├── Review
└── Workspace ready
```

The setup flow must support:

- Save and continue later.
- Back navigation without losing data.
- Validation at each step.
- A visible completion checklist.
- A review page showing inputs before activation.
- Re-entry through Settings after activation.

### 9. Existing Application Handoffs

#### Schedule

Continuum launches:

- Staff dashboard.
- New batch flow.
- Existing batch editor.
- Booking roster.

Continuum may pass:

- Workspace ID.
- Academic period ID.
- Module ID.
- Activity ID.
- Return URL.

Schedule remains responsible for:

- Batch creation and editing.
- Slot generation.
- Publishing.
- Booking.
- Attendance.

#### Group Sync

Continuum launches:

- Host session creation.
- Existing session.
- Student join flow where appropriate.

Group Sync remains responsible for:

- Roster upload.
- Live lobby.
- Group generation.
- Manual reassignment.
- Export.
- Session completion.

#### Venue Booking

Continuum launches:

- Venue request.
- My requests.
- Operations approvals.
- Venue registry.

Venue Booking remains responsible for:

- Venue creation.
- Availability and request handling.
- Approval or decline.
- Conflict resolution.

### 10. Cross-App Link Contract

Every connected service link should include:

- `source=continuum`
- `workspaceId`
- `periodId`, when applicable
- `activityId`, when applicable
- `returnUrl`
- A signed or otherwise trusted context token once authentication integration exists

Until the contract is implemented, links must be treated as configured destinations, not as proof of synchronisation.

### 11. Navigation Labels

Prefer direct product language:

- Home
- Workspaces
- Activities
- Services
- People
- Settings
- Open Schedule
- Open Group Sync
- Open Venue Booking
- Continue setup
- Review request
- Assign access

Avoid primary navigation labels such as:

- Orchestration console
- Evidence
- Governance
- Experience preview
- Maturity registry
- POC audit

Those concepts may exist in admin settings or internal documentation, but they should not define the user’s everyday product experience.

### 12. Empty and Error States

#### No workspace

“Create your first workspace” with a direct setup action.

#### Setup incomplete

“Continue setup” with the next incomplete step identified.

#### No connected service

“Connect a service” with the relevant configuration action.

#### Service unavailable

“Schedule is unavailable right now. Check connection settings or open the service directly.”

#### No activities

“Create an activity” with workspace and module context prefilled.

#### Access denied

“You do not have access to this workspace or activity. Request access from a workspace administrator.”

### 13. IA Decision Log

- Continuum owns context, access, setup, activity relationships, and handoffs.
- Existing apps own their operational workflows and data mutations.
- BCom is the first workspace fixture, not a global product vocabulary.
- Student and temporary-user experiences should be launched through scoped links, not represented as a permanent persona switcher.
- The orchestration model is an implementation and information architecture principle, not a user-facing section.
