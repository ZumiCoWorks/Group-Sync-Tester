# AFDA Continuum POC

Continuum is the umbrella proof-of-concept experience for Production Ventures. Foundation Phase 1 is deliberately fixture-only: it does not persist academic records, call Microsoft Graph, write to CARS or replace the existing AFDA applications.

## Run locally

From the repository root:

```bash
npm install
cp apps/continuum/.env.local.example apps/continuum/.env.local
npm run dev:continuum
```

Set `NEXT_PUBLIC_CONTINUUM_DEMO_MODE=true` only for an explicitly labelled demonstration. The persona switcher changes local presentation and never creates trusted authority.

## Module links

Continuum opens the existing applications as separate deployments. Configure:

- `NEXT_PUBLIC_SCHEDULE_STAFF_URL`
- `NEXT_PUBLIC_SCHEDULE_STUDENT_URL`
- `NEXT_PUBLIC_GROUPS_URL`
- `NEXT_PUBLIC_WORKSUITE_URL`

If a URL is absent, the corresponding module is shown as not configured rather than silently falling back to an unknown deployment.

## Verification

```bash
npm --workspace @afda/continuum-ui run type-check
npm --workspace @afda/continuum run type-check
npm --workspace @afda/continuum run lint
npm --workspace @afda/continuum run build
```

## Deployment

Deploy `apps/continuum` as a separate Vercel project. It consumes `packages/continuum-ui`, so the Vercel project must retain monorepo access outside the application root. Use a Preview deployment first and do not assign an existing application domain.

## Administrative status

`/admin` is a policy demonstration, not an active user-management console. Production administration requires server-enforced authentication, RLS, scoped capability endpoints, append-only audit records, expiry/revocation handling and owner-approved operating procedures. See `docs/continuum/operations-and-administration.md`.
