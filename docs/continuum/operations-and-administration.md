# AFDA Continuum — Operations and Administration

## What can be operated today

The deployed Phase 1 preview supports a complete fictional walkthrough: navigate Ventures, switch demo personas, inspect operational lineage, exercise a non-persistent import preview, generate a DEMO Registry CSV and open existing modules through configured links.

It does not yet support real account administration, persistent Ventures, marking, result release, Registry certification or live integrations.

## Ownership model

| Area | Accountable owner | Routine operator |
| --- | --- | --- |
| Platform availability and releases | Product/platform owner | Technical maintainer |
| Identity and baseline roles | Institutional IT | Platform administrator |
| Venture membership and teaching authority | Academic owner | Venture coordinator |
| Spaces and resources | Operations owner | Venue administrator |
| Result certification and CARS handoff | Registry owner | Registry-capable staff |
| Microsoft 365 consent and secrets | Institutional IT/security | Integration maintainer |
| Database migrations, backup and restore | Platform/database owner | Approved technical maintainer |

No single role should control assessment, release and official export without an explicit institutional decision.

## Setup path from POC to pilot

1. Approve Phase 1 workflow and terminology using the preview.
2. Resolve migration 008 and credential exposure risks.
3. Name accountable owners in the table above.
4. Approve the minimal Phase 2 schema, RLS and server endpoints.
5. Deploy to a separate staging Supabase/Vercel environment.
6. Configure test identities and least-privilege capabilities.
7. Validate one fictional end-to-end Venture and recovery procedure.
8. Pilot with a small authorised cohort; no historical bulk import initially.
9. Review pilot evidence before production promotion.

## Routine maintenance

- Per release: type-check, lint, build, migration review, preview verification and owner sign-off.
- Weekly during pilot: failed imports, capability expiry, unresolved mappings and application errors.
- Monthly: audit-event review, backup/restore evidence and dependency/security triage.
- Quarterly: access recertification, Microsoft permissions, data-retention checks and runbook rehearsal.
- Annually or on policy change: role matrix, CARS contract and disaster-recovery review.

## Release and rollback

Each application remains an independent Vercel project. Continuum releases begin as feature-branch previews. Production promotion is explicit and never requires merging other application changes. Database migrations are separately approved, applied to staging first and never coupled silently to a frontend deployment.

Rollback uses Vercel deployment history for application code. Data rollback uses a reviewed forward migration or restore procedure; destructive ad hoc SQL is prohibited.

## Support and incident flow

1. Record the affected user, Venture, action, timestamp and visible error without copying protected data into chat or issue titles.
2. Determine whether the owner is Continuum, an existing module, Microsoft 365 or CARS.
3. Preserve audit/import identifiers and stop retries if duplication is possible.
4. Revoke compromised sessions or grants when required.
5. Restore service using the documented deployment or database procedure.
6. Record the decision and preventative action.

## Pilot readiness gate

Real use begins only when authentication, scoped capability enforcement, RLS tests, append-only audit behaviour, backups, support ownership and the relevant integration contract are all approved. A public fixture preview is evidence for those decisions, not a substitute for them.
