# Deploy & Smoke Test Checklist

This file documents the minimal steps to deploy the backend and frontends and verify connectivity.

## 1. Set Vercel environment variables

- Backend project (Vercel project for `backend`):
  - `NODE_ENV=production`
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
  - `FRONTEND_URL` — comma-separated frontend domains, e.g. `https://student-public-zcw-nav-eaze.vercel.app,https://slot-booking-red.vercel.app`

- Frontend projects (Vercel projects for `apps/student-public` and `apps/slot-booking`):
  - `NEXT_PUBLIC_BACKEND_URL=https://afda-api.vercel.app`
  - (slot-booking only) `NEXT_PUBLIC_BATCH_LINK_BASE` set to your booking domain

## 2. Branch, commit and push

```bash
git checkout -b fix/use-next-public-backend
git add -A
git commit -m "Use NEXT_PUBLIC_BACKEND_URL in frontends; accept FRONTEND_URL in backend CORS"
git push --set-upstream origin HEAD
```

## 3. Deploy (via CI or manually)
- Push to `main` (if your CI deploys on merge), or run Vercel deploys from the repository root.

## 4. Quick smoke checks

- Backend health:

```bash
curl -i https://afda-api.vercel.app/api/health
curl -i https://afda-api.vercel.app/api/ready
```

- From a browser: open the deployed frontend and in Developer Tools → Network, confirm API requests go to the value of `NEXT_PUBLIC_BACKEND_URL` and return 200/2xx responses.
- Confirm no CORS errors in the browser console.

## 5. Troubleshooting
- If you see CORS errors, ensure the frontend origin is included in backend project's `FRONTEND_URL` env var and that backend was redeployed after the change.
- If frontends still call `localhost`, confirm Vercel built the latest commit and `NEXT_PUBLIC_BACKEND_URL` is set in the Vercel project (envs are injected at build time).

---

Last modified: automated change by developer tool.
