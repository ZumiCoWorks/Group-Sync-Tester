# Decisions required from AFDA owners

1. **Security/DevOps:** rotate/revoke all private values in tracked deployment environment files; identify consumers/exposure window; remove from tracking/history via approved incident process; preserve logs/recovery path.
2. **Academic + Security:** define Group Sync public join vs host-only actions, host authentication, session-code issue/rate/expiry, minimum roster fields, access and retention.
3. **AFDA IT:** retain Supabase Auth or approve Entra federation; define immutable internal ID, external subject mapping, provisioning/offboarding, MFA, role ownership, guest/ad-hoc lifecycle, and null-expiry semantics.
4. **Service owners:** approve baseline role matrix, workspace/service/action grants, expiry/revocation and admin bypass; define Schedule/WorkSuite object ownership.
5. **Data/DBA/Platform:** confirm canonical server API and one migration tree; identify production deployment; verify live migrations, grants, RLS, policies, backup/restore and rollback.
6. **AFDA IT/Security:** decide whether Azure hosting is approved, allowed services/regions, network/identity requirements, logging, support, procurement and cost owner. Hosting and database are separate decisions.
7. **Academic/CARS owners:** approve rubric template/versioning, assessment IDs, individual/group/panel marking, export format, validation, review/approval, audit and manual CARS entry.
8. **Document owner:** provide the six named Continuum DOCX files or identify canonical replacements/revisions. They were not present in searched locations.
9. **DevOps:** confirm Vercel roots/domains/traffic, backend deployment and env ownership; identify whether legacy backend or server/backend is active.

## Recommended order

Resolve decisions 1 and 2 first. Then settle identity/role and canonical deployment/schema boundaries. Evaluate Azure only after institutional requirements and owners are clear. Design rubric pilot after academic/CARS approval; keep it a reviewed manual export initially.
