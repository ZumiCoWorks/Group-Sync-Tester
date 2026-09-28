# AFDA Continuum — Phase 1B Visual Prototype PRD

Date: 10 September 2026

Branch: `feature/afda-continuum-poc`
Implementation: visual, clickable, local fixture data only

## 1. Product decision

AFDA Continuum is intended to become the institution-wide learning-management system. Phase 1B does not claim that this institutional model is already validated or operational. It provides a coherent orchestration-console prototype through which an authorised platform administrator can inspect proposed structure, current shared services, one configured school sandbox and downstream experience previews.

The central design decision is to separate the long-term product intention from the evidence available today:

- **Long-term intention:** Continuum becomes the LMS and coordinates school workspaces, academic periods, learning configuration, access, assessments, shared services, integrations and governance.
- **Phase 1B evidence:** Group Sync and Schedule exist; Spaces & Resources is emerging; BCom academic objects and rubrics are clickable fixtures; CARS and Microsoft 365 remain disconnected dependencies.

This distinction is visible in the interface through status labels and boundary copy. The prototype demonstrates how the ecosystem could be governed without pretending that a full academic engine, integration model or school-wide operating model has been approved.

## 2. Problem statement

The earlier Continuum shell could locate existing tools, but it read as a dashboard rather than an LMS-oriented orchestration environment. It did not provide enough depth to answer practical questions:

- Where does an academic term exist in the product?
- How does a school sandbox sit inside an institution-wide product?
- How can assessments differ without being forced through one workflow?
- When do Group Sync, Schedule or Spaces actually apply?
- How would a lecturer, tutor, ad hoc marker or external assessor receive limited access?
- What would a digital rubric look like before official-grade rules are known?
- How does Continuum avoid taking over CARS responsibilities?

Phase 1B answers those questions with a visual and clickable model, not a database implementation.

## 3. Primary user and perspective

The primary user is the Continuum platform administrator or super-admin configuring and demonstrating the POC. This user can inspect:

- institution-level boundaries;
- academic-period context;
- school workspace readiness;
- the fictional BCom academic configuration;
- assessments distributed across a term;
- conditional use of shared services;
- marker allocation and temporary access;
- rubric structures and review progress;
- connector dependencies;
- fictional audit history.

“Preview touchpoint” is secondary. It does not replace the primary perspective and never simulates an authenticated role change.

## 4. Product hierarchy

The visual prototype uses this navigable hierarchy:

```text
Continuum
→ Institution and academic period
→ School workspace
→ Programme, module or collaborative unit (prototype)
→ Assessment or enabled shared service
→ Scoped user access
```

Only the first three levels are candidates for the orchestration concept. The BCom programme, module, discipline, assessment and rubric details are evaluation fixtures, not approved database entities. Their existence in the prototype must not drive migration design without academic discovery.

## 5. Scope

### Included

- An institution-level orchestration page.
- Academic-period list and a detailed 2026 Term 3 view.
- Pre-term planning displayed separately from assessment activity.
- A school-workspace manager with BCom configured and other schools unconfigured.
- A richer fictional BCom workspace.
- Three fictional BCom modules or collaborative units.
- Four fictional BCom disciplines.
- Four distinct assessment examples distributed across the term.
- Conditional service applicability for Group Sync, Schedule and Spaces & Resources.
- Browser-only marker progress controls.
- Ad hoc and external marker scopes with explicit expiry.
- A digital rubric prototype with criteria, weights, written feedback, marker progress and lecturer review.
- Six BCom touchpoint previews: student, lecturer, tutor, operations, ad hoc marker and external assessor.
- Environment-controlled entry points to existing applications.
- CARS, Microsoft 365 and CELCAT boundaries.
- Fictional POC audit records.

### Excluded

- Database migrations or academic schema.
- Supabase reads or writes for prototype academic objects.
- Real users, students, groups, assessments, marks or results.
- Automatic grade calculation.
- A universal grading formula.
- Formal moderation, progression or final-grade approval.
- Direct CARS reads or writes.
- Microsoft Graph access.
- A CELCAT-equivalent scheduling engine.
- Automated venue allocation or validated clash prevention.
- Configuration for BA, MP or any other AFDA school.
- Changes to the existing applications' workflows or protected tables.

## 6. Information architecture

| Area | Purpose | Phase 1B evidence |
| --- | --- | --- |
| Platform overview | Honest entry point and current POC attention | Built shell + prototype summaries |
| Institution | Proposed institution-level control boundary | Prototype |
| Academic periods | Establish the term before downstream activity | Prototype |
| School workspaces | Separate school-specific configuration and language | BCom prototype; others proposed |
| Shared services | Show what exists and what remains emerging | Built / Emerging |
| Experience preview | Inspect fictional downstream touchpoints | Prototype |
| People & access | Demonstrate baseline role plus limited scope | Prototype on top of built baseline roles |
| Integrations | Preserve authority and connection boundaries | Dependent |
| Audit & governance | Explain POC actions and future audit reuse | Prototype |

The sidebar is deliberately an administrative map rather than a student learning menu.

## 7. Evidence model

Every consequential capability uses one of five labels:

| Label | Meaning | Application in this POC |
| --- | --- | --- |
| Built | Functioning in the repository or current POC | Group Sync, Staff Schedule, Student Booking, shell and navigation |
| Prototype | Fictional, clickable configuration | BCom academics, assessments, rubrics, preview experiences and access examples |
| Emerging: validation required | Work exists but is not a proven shared service | Spaces & Resources |
| Proposed | Possible direction, not configured or approved | Other schools, future adapters and orchestration rules |
| Dependent | Requires an external decision, system, policy or credential | CARS, Microsoft 365 and official academic rules |

Colour supports these labels but never carries their meaning alone.

## 8. Academic timing model

The prototype explicitly rejects a mandatory sequence of assessment creation, group formation, slot booking, venue allocation and marking.

Instead:

1. The academic period and BCom workspace provide context.
2. Pre-term planning is shown on its own track.
3. A Group Sync Business may exist before and across assessments.
4. Assessments are distributed through the term.
5. Every assessment declares its participation model.
6. Group, schedule and space references appear only when needed.
7. Rubric activity and review follow the relevant assessment activity.

This is a visual relationship model only. It does not establish database sequencing or AFDA policy.

## 9. BCom sandbox

The BCom workspace is the sole configured sandbox. It is not the homepage identity or assumed template for all schools.

Fictional context:

- Academic year: 2026.
- Period: Term 3, 20 July to 25 September.
- Programme: Bachelor of Commerce in Business Innovation.
- Collaborative language: Business / Innovation.
- Units: Venture Lab, Market Systems and Innovation Practice.
- Disciplines: Business Strategy, Finance, Marketing and Innovation Practice.

The page places an explicit Prototype label beside this configuration and states that naming and structure require academic validation.

## 10. Assessment examples

### 10.1 Opportunity Reflection

- Participation: individual.
- Scope: school-specific.
- Discipline: Innovation Practice.
- Group Sync: does not apply.
- Schedule: does not apply.
- Spaces: does not apply.
- One lecturer marker.
- Individual rubric and written feedback.

This is the simplest route and proves that Continuum does not force services into an assessment.

### 10.2 Business Concept Presentation

- Participation: existing team.
- Uses fictional Group Sync Business `GS-DEMO-6F2`.
- Requires a scheduled presentation window.
- References Studio B, planned before the term.
- Uses group and discipline-specific rubric criteria.
- Allocates a lecturer, tutor and ad hoc marker.
- Ad hoc access is limited to the assessment and expires.

### 10.3 Finance Discipline Review

- Belongs to Market Systems.
- Participation: individual.
- Applies only to Finance.
- Uses Finance-specific criteria.
- Uses one lecturer marker.
- Does not require Group Sync, Schedule or Spaces.

### 10.4 Innovation Readiness Panel

- Scope: cross-school, shown as a prototype possibility.
- Participation: assessment-specific team.
- Requires a scheduled panel session.
- References Innovation Hub, planned before the term.
- Allocates multiple lecturers, an ad hoc marker and an external assessor.
- Temporary users see only assigned assessment/rubric context and an expiry.
- Shows outstanding, submitted and reviewed states.
- Does not calculate or release an official result.

## 11. Digital rubric prototype

Each assessment links to its own rubric. The rubric surface shows:

- template name and prototype version;
- criteria descriptions;
- criterion weighting;
- whether a criterion is group, individual or discipline-specific;
- current marker allocations;
- outstanding, submitted and reviewed states;
- editable fictional written feedback;
- a browser-only lecturer review demonstration;
- fictional audit events;
- an explicit official-record boundary.

The sum of weights is displayed because it helps review rubric structure. The prototype does not accept scores, calculate a grade, decide moderation or produce an official mark.

## 12. People and scoped access

The access concept combines an existing baseline identity role with a proposed contextual scope:

```text
Existing identity and baseline role
+ school workspace
+ optional module, assessment or rubric assignment
+ optional expiry
→ effective access, enforced later by server and database policy
```

The UI demonstrates this concept with fictional users. It does not implement permission grants. Ad hoc and external previews visibly limit the user to one assessment and state what they cannot access.

## 13. Existing services

### Group Sync — Built

Group Sync remains the owner of session-based group formation and its protected records. Continuum displays a fictional reference to an existing Business team. Future workspace or assessment relationships must be additive mappings.

### Schedule — Built

Staff Schedule and Student Booking remain independently deployable. Continuum shows conditional schedule context only for assessments that require a timed session. It does not claim timetable optimisation or clash detection.

### Spaces & Resources — Emerging: validation required

Continuum displays venue planning as a pre-term concern and allows an assessment fixture to reference a planned allocation. It does not claim automatic allocation, proven clash prevention or a validated AFDA-wide workflow.

The existing applications may display a small environment-controlled Continuum identity bar. Their core routes, authentication and workflows remain unchanged.

## 14. External systems and authority

### CARS

CARS remains authoritative for:

- enrolment;
- official marks and results;
- Registry work;
- certification;
- institutional reporting.

Phase 1B has no CARS connection. Rubrics and progress states are local visual fixtures. A future handoff contract would require CARS ownership, data definitions, security review, templates and approval.

### Microsoft 365

Microsoft 365 is a disconnected dependency. No tenant, consent, identity, Graph permission or collaboration flow is simulated.

### CELCAT

CELCAT is a benchmark for future scheduling and resource-orchestration discovery: constraint-aware planning, clash detection, publication and room optimisation. It is not a connector or emulated engine in Phase 1B.

## 15. Interaction behaviour

The prototype provides useful interaction without false persistence:

- Opening an assessment changes the service cards according to that assessment.
- Applicable services link to their Continuum boundary pages.
- Non-applicable services show “Does not apply”.
- Marker progress can be changed in the browser.
- Written rubric feedback can be edited in the browser.
- Lecturer review can be demonstrated in the browser.
- Ad hoc and external marker preview links change the previewed touchpoint.
- Every browser-only action says that nothing has been saved.

## 16. Required demonstration path

1. Open `/` and explain the status vocabulary.
2. Open `/institution` to establish the orchestration boundary.
3. Open `/periods/2026-term-3` and compare pre-term planning with the assessment track.
4. Enter `/workspaces/bcom` and review the fictional academic configuration.
5. Open all four assessments.
6. Compare the conditional service cards across individual, team, discipline and panel examples.
7. Change a marker progress state.
8. Open a rubric, edit feedback and demonstrate lecturer review.
9. Preview `adhoc` and `external` touchpoints.
10. Return to `/` through the global navigation.

## 17. Data and technical constraints

- All new academic data lives in `apps/continuum/src/lib/bcom-prototype-data.ts`.
- Client interactions use React component state only.
- No API route or backend endpoint was introduced.
- No Supabase client is imported by the academic prototype.
- No migration was created or modified.
- Existing protected tables remain unchanged.
- Existing module URLs are supplied only through public environment variables.
- Missing module URLs produce an honest “Not configured” state.

## 18. Accessibility and responsive behaviour

- Semantic headings, lists, tables, labels and status regions are used.
- Controls have explicit labels and at least 44px target height.
- Keyboard focus uses the existing high-contrast teal outline.
- Status meaning is expressed in text.
- The navigation becomes horizontally scrollable on smaller screens.
- Structured grids collapse to one or two columns.
- Tables convert to labelled record blocks on narrow screens.
- Reduced-motion preferences remain supported.

## 19. Acceptance criteria

Phase 1B is acceptable when:

- the application type-checks and builds;
- all required routes render;
- the BCom workspace can be entered from the overview;
- four assessment examples are inspectable;
- service applicability changes honestly between examples;
- marker progress controls respond without persistence claims;
- each assessment opens a rubric;
- ad hoc and external previews visibly restrict context;
- CARS and Microsoft 365 remain disconnected and clearly labelled;
- other schools remain unconfigured placeholders;
- no migration, Supabase write or existing workflow change is introduced;
- the local preview can be started and walked through.

## 20. Recommended next phase

Do not proceed directly to database design. First run the visual prototype with BCom academic, operations, Registry/CARS and IT stakeholders. Record which structures and terms are validated, rejected or school-specific. The next implementation phase should be based on that evidence and should separately approve:

1. academic object definitions and ownership;
2. identity and scoped authorisation rules;
3. CARS data/handoff contracts;
4. shared-service context mappings;
5. Spaces & Resources operating workflow;
6. audit, retention and approval policy;
7. migration 008 status before any migration 009 is considered.
