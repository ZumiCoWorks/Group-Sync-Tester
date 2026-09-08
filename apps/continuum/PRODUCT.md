# AFDA Continuum

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Continuum serves AFDA students and authorised institutional staff involved in Production Ventures. Staff audiences include junior and senior tutors, lecturers, adhoc specialists, Operations venue administrators, Registry-capable staff and administrators. Each audience works within an existing institutional role and, where required, a venture- or assessment-scoped capability.

Students use the broader platform to discover and claim published booking slots and to understand their Venture participation. Staff coordinate teaching activity, interdisciplinary groups, spaces, assessment evidence, finalisation, moderation, Registry readiness and export handoff.

## Product Purpose

Continuum provides one coherent operational and academic view of a Production Venture across AFDA's existing scheduling, student booking, Group Sync and WorkSuite tools. It relates people, activity, learning evidence and result lineage without replacing the systems that already own those workflows.

Foundation Phase 1 is a fixture-only proof of concept. Success means stakeholders can follow a believable fictional Venture from pre-Continuum source activity, through assessment and authority checkpoints, to a controlled Registry and CARS handoff while understanding what is live, imported, disconnected or proposed.

## Positioning

The Production Venture is the organising unit. Continuum connects operational activity and academic outcomes around that unit while preserving the ownership, deployment boundary and source lineage of each existing AFDA module. It is an umbrella application and provider-neutral domain direction, not a replacement LMS or a reimplementation of Microsoft Teams, CARS, Schedule, Group Sync or WorkSuite.

## Operating Context

- Staff Schedule owns batches, slots, attendance, imports and exports.
- Student Schedule preserves anonymous discovery and booking of published slots.
- Group Sync owns session-based interdisciplinary group formation.
- WorkSuite owns department, space and resource requests; the older batch-linked venue workflow remains available for compatibility.
- Microsoft 365 and Teams are represented through disconnected, mock or browser file-import adapters until AFDA approves a tenant, permissions and consent model.
- Registry review validates fictional outcomes and prepares a demonstration CSV handoff. CARS remains a manual downstream institutional system in this POC.
- Existing applications remain independently deployable and are reached through configurable deep links rather than iframes.
- The canonical future API boundary is the Express/Supabase application in `server/`; `backend/` remains a legacy compatibility copy.

## Capabilities and Constraints

- Routes cover overview, Ventures, Venture detail, Schedule, Groups, Spaces & Resources, Learning, Registry, Integrations and Administration.
- The POC uses local fictional fixtures only. It has no persistent academic schema, Supabase write path, live Microsoft 365 connection or direct CARS integration.
- Foundation Phase 1 creates or applies no database migration. Migration 008 must be reviewed and intentionally resolved before any migration 009 is designed.
- Existing `batches`, `slots`, `sync_sessions` and `sync_participants` contracts must not be changed for Continuum. Future relationships belong in additive mapping tables.
- Existing `audit_logs` is the intended future lineage store; a duplicate audit table is not justified. Phase 1 activity is fictional and local.
- Baseline roles remain `student`, `tutor_junior`, `tutor_senior`, `lecturer`, `adhoc`, `ops_venue_admin` and `admin`.
- Registry is not a baseline role. Registry-capable staff use an existing authorised role plus proposed `registry_review` and `export_authority` scoped capabilities.
- Evaluation, finalisation, release, certification and export are distinct authority boundaries.
- Student Public keeps anonymous booking discovery and claim behaviour. Ventures, assessment results, capability data and integrations have no anonymous access path.
- Environment variables are authoritative for module URLs and future integration configuration. New Continuum code must not contain real tenant IDs, credentials, tokens, production URLs or browser credential fallbacks.
- All people, identifiers, marks, mappings and activity displayed in the POC are visibly fictional.

## Brand Commitments

The product name is “AFDA Continuum.” The current lockup is text only and must not be presented as an official AFDA logo. No official logo package or brand-guideline asset has been supplied. Exact colours remain provisional pending approved AFDA brand assets.

An owner-supplied screenshot of the live CARS welcome screen establishes a useful institutional reference: emphatic black, white and red identification; direct sans-serif language; and a creative-production illustration field. It is reference evidence rather than a distributable asset. Continuum should feel related without reproducing the CARS background, logo artwork or legacy modal-first composition.

Product language should be precise, calm and operational. It must distinguish fictional demo data from live institutional state and identify the owner or source of externally managed workflows.

## Evidence on Hand

- Accepted repository audit: `../../docs/continuum/repository-audit.md`
- Existing-system map: `../../docs/continuum/existing-system-map.md`
- Data-safety plan: `../../docs/continuum/data-safety-plan.md`
- Detailed fictional Venture, assessment, Registry and activity fixtures: `src/lib/demo-data.ts`
- Provider-neutral Microsoft 365 contracts and disabled Graph boundary: `src/domain/`
- Existing Continuum routes and shell: `src/app/` and `src/components/`
- Shared operational components and semantic tokens: `../../packages/continuum-ui/`

No official AFDA logo package, brand guidelines, live Microsoft tenant approval, real student dataset, production results, user testimonial or measured outcome evidence is present. Future work must not fabricate these.

## Product Principles

1. Organise the experience around the Production Venture while preserving each source system's ownership.
2. Make source, authority, state and next action legible at every consequential step.
3. Prove workflows with unmistakably fictional fixtures before introducing persistence or institutional integrations.
4. Keep academic authority scoped, separated and auditable from evaluation through export.
5. Extend the existing platform additively so current booking, grouping and venue workflows remain independently usable.

## Accessibility & Inclusion

Continuum must support keyboard navigation, visible focus, semantic structure, readable status text that does not rely on colour alone, responsive layouts and reduced-motion preferences. Operational tables and controls must remain understandable to users working with different roles, disciplines, campuses and levels of technical familiarity.
