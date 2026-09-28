# AFDA Continuum

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user for the conference prototype is the Continuum super administrator or orchestrator. They need to understand the institution, academic period, school workspaces, shared services, scoped access, assessments and cross-school activity from one signed-in product.

Student, lecturer, tutor, assessor and operations views are previews. Previewing an experience never changes the orchestrator's identity or trusted authority.

## Product Purpose

AFDA Continuum is a proposed orchestration and experience layer for AFDA's academic and operational workflows. It facilitates school workspaces, teams, assessments and marking workflows, scheduling, spaces and resources, people and scoped access, existing application entry points and potential cross-school collaboration.

Each school remains responsible for its programmes, modules, disciplines, assessment design, rubrics, grading rules and academic decisions. Continuum does not define curriculum.

## Positioning

Continuum provides a consistent institutional context and controlled handoff between school workspaces and independently owned services without replacing those services or pretending to own official academic records.

## Operating Context

The conference demonstration is a deterministic five-minute product journey at laptop/projector size. It begins at the institution level, enters the configured BCom workspace, completes an ad hoc assessor assignment, previews the same assessment for different users, enables Group Sync for another school workspace and closes on a cross-school exploration.

## Capabilities and Constraints

- BCom is the configured pilot workspace and the deepest demonstration.
- BCom multidisciplinary teams use four labels confirmed in the repository: Start-Up Finance, Marketing and Sales, U(I)X Operations and Design, and Business Strategy & Management.
- Group Sync and Schedule are existing independently deployable services.
- Spaces & Resources is emerging and unvalidated.
- Other school workspaces may enable established services without an invented academic model.
- Browser-only demo state may persist through localStorage but is not trusted authority.
- No database migration, Supabase write, Microsoft 365 connection, CARS connection, official result export or automatic grade calculation belongs in this presentation slice.
- Existing `batches`, `slots`, `sync_sessions` and `sync_participants` contracts remain protected.

## Brand Commitments

The product name is AFDA Continuum. The working lockup is a concept, not an official AFDA logo. The interface uses black, white and AFDA red, direct sans-serif typography, confident operational density and clear hierarchy. “Production Venture” is not universal terminology.

## Evidence on Hand

- Existing applications: `slot-booking`, `student-public`, `group-sync` and `venue-booking` / WorkSuite.
- Group Sync contains the four BCom discipline labels used in the prototype.
- Existing services and protected records are implemented in the current monorepo.
- All people, assessments, teams, dates, access grants and cross-school projects in the conference slice are fictional demo data.

## Product Principles

1. Show orchestration through completed actions, not architecture explanations.
2. Keep school academic authority visible and intact.
3. Connect services only where the activity requires them.
4. Preserve user identity while previewing another experience.
5. Label fictional and externally dependent content without allowing labels to dominate ordinary product screens.

## Accessibility & Inclusion

The presentation slice targets WCAG 2.2 AA with semantic structure, keyboard-operable controls, visible focus, sufficient contrast, status text that does not rely on colour, reduced-motion support and responsive layouts.
