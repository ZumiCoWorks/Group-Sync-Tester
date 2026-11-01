# Supabase and AFDA Azure readiness

## Current state

The backend requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and creates a privileged Supabase client (server/src/index.ts:33-46). Authentication uses Supabase Auth getUser and maps its UUID to public.users.role_v2 (server/src/middleware.ts:43-99). Migrations are spread across multiple trees. Continuum orchestration enables RLS but expects API checks; Group Sync migration permits all operations. App browser Supabase clients are configured inconsistently. Tracked private env credentials are a P0 incident; values are intentionally not listed.

## Readiness by concern

| Concern | Assessment | Gate |
|---|---|---|
| Identity / Entra | No Entra provider or approved tenant integration verified; Supabase Auth UUID is current identity. | AFDA IT approves federation, tenant, MFA/conditional access, stable subject mapping, account lifecycle, consent/scopes, guest/ad-hoc rules, owner and rollback. Keep immutable internal ID. |
| Hosting | Vercel configs exist; actual project settings and AFDA Azure target are unknown. | Confirm classification, approved region, network/ingress, TLS/WAF, secrets, logs, deployment/rollback/support owner. |
| Database | Supabase/Postgres is current; no evidence Azure DB is required or approved. | Compare residency, backup/PITR, RPO/RTO, encryption/key ownership, DBA/support, costs, extension compatibility, restore/export. Retain Supabase until an institutional requirement justifies change. |
| Data/security | API service role bypasses RLS; route checks are inconsistent; Group Sync policy is permissive. | Resolve P0s; canonicalize migrations; verify live grants/RLS; define privacy, audit, retention, backup/restore and incident controls. |
| Governance | Azure scope, approval, cost and support responsibility unknown. | Named IT/security/data owners approve tenancy scope, data protection, retention, logging, support, procurement and cost. |
| Integrations | No live CARS, Graph, Microsoft 365 or Entra integration verified. | Define source of truth, data direction, approved fields, consent, audit, error/retry and manual fallback. |

## Recommendation

Keep Supabase Auth/PostgreSQL and independent apps while remediating current controls. Rotate exposed credentials; secure service APIs; verify live RLS and canonical schema/deployments. Then evaluate Entra federation while preserving internal UUID. Consider hosting and database as separate decisions. Do not create Azure resources or move data based only on tenant access.

## Unknown until verified with operators

Remote Supabase project count/schema/policy/migration state; Vercel project bindings and live traffic; Azure approval/regions; backup and retention; cost/support ownership; incident window. No remote administration was performed in this audit.
