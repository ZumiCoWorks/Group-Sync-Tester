# Release Checklist (PR Note)

Copy this into your release PR description and tick each box during rollout.

## Pre-deploy

- [ ] Main branch is green (build + tests)
- [ ] Monitoring secrets are set in GitHub:
  - `BACKEND_HEALTHCHECK_URL`
  - `BACKEND_READINESS_URL`
  - `STUDENT_APP_URL`
  - `STAFF_APP_URL`
  - `ALERT_WEBHOOK_URL` (optional)
- [ ] Production environment variables are set for backend and both frontend apps
- [ ] Database migrations are applied to production

## Deploy

- [ ] Deploy backend project
- [ ] Deploy student frontend project
- [ ] Deploy staff frontend project
- [ ] Confirm deployment logs show no runtime crashes

## Smoke test (one command)

Run from repository root:

```bash
BACKEND_URL=https://api.example.com \
STUDENT_APP_URL=https://book.example.com \
STAFF_APP_URL=https://staff.example.com \
BATCH_PATH=/batch/<known-batch-id> \
npm run smoke:test
```

Expected result: `Smoke test passed.`

## Manual checks

- [ ] Student: lookup batch -> select slot -> book -> confirmation page
- [ ] Staff: open dashboard -> edit batch -> publish -> export CSV/XLSX/PDF
- [ ] Audit logs: filter and export works
- [ ] Backend endpoints `/api/health` and `/api/ready` return HTTP 200

## Post-deploy

- [ ] Trigger `Uptime Monitor` workflow manually once
- [ ] Confirm webhook alert path (if configured) from a test/failing check
- [ ] Monitor logs and metrics for at least 30 minutes
- [ ] Announce release completion in team channel
