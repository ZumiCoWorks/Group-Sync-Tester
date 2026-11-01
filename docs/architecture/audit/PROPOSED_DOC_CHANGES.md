# Proposed architecture-document corrections

The six source DOCX files were unavailable. These are proposed topics for owners to reconcile when supplied, not claims about the documents' current wording. docs/continuum/architecture.md is supplementary context only.

| Document | Proposed corrections | Evidence |
|---|---|---|
| 01_PRD_Continuum.docx | Separate live console/orchestration from mock assessment; require direct-entry permission parity; preserve source-service ownership; state CARS manual-entry boundary; acceptance-test Group Sync host authorization and roster privacy. | apps/continuum/src/app/page.tsx; lib/presentation-data.ts; server/src/routes/continuum.ts and group-sync.ts |
| 02_TRD_Continuum.docx | Specify Supabase Auth UUID -> users.role_v2 -> role/object checks; service-role RLS bypass; fail-closed secrets/env; session ownership, audit, retention, canonical migrations. State Entra/Azure as unapproved options. | server/src/middleware.ts; server/src/index.ts; server/migrations |
| 03_UI_UX_Design_Continuum.docx | Label fixtures/demo; never imply live grades/CARS transfer; surface source failures; keep roster fields role-scoped. | apps/continuum/src/app/presentation/deck/page.tsx; presentation-data.ts; operational page |
| 04_Appflow_Continuum.docx | Diagram direct and Continuum entry converging on same server checks; separate public join from host management; specify code expiry, roster lifecycle, Schedule ownership and revoked-grant behavior. | server/src/routes/continuum.ts; group-sync.ts; batches.ts; worksuite.ts |
| 05_Backend_Schema_Continuum.docx | Reconcile existing Supabase schema; choose one migration chain; define effective RLS/grants, owner/session identity, minimum projections, audit and retention; external identity mapping only after approval. | server/migrations/009_continuum_orchestration.sql; 004_group_sync.sql; 006_phase2_security_rbac.sql; duplicate migration roots |
| 06_Implementation_Plan_Continuum.docx | Put credential incident and Group Sync access remediation first, then live DB verification, migration/deployment authority, role expiry and direct-vs-Continuum tests; gate Azure/rubric on owners. | P0/P1 findings and DECISIONS_REQUIRED.md |

Every revised requirement should have owner, status (verified/partial/mock-demo/planned/unknown), evidence, impact, decision gate and rollback/testing criteria. Do not overwrite originals without document-owner review.
