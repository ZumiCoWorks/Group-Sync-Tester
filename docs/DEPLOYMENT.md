# Deployment Guide

This project is designed to deploy with Vercel for the frontends and the backend API.

## Frontend Deployment

Recommended target: Vercel static/edge-hosted Next.js applications.

### Student Public App

- Project root: `apps/student-public`
- Build command: `npm run build`
- Output: Next.js app deployed by Vercel
- Required environment variables:
	- `NEXT_PUBLIC_BACKEND_URL` - production backend URL

### Slot Booking App

- Project root: `apps/slot-booking`
- Build command: `npm run build`
- Output: Next.js app deployed by Vercel
- Required environment variables:
	- `NEXT_PUBLIC_BACKEND_URL` - production backend URL
	- `NEXT_PUBLIC_BATCH_LINK_BASE` - production batch link base URL

### Frontend deployment steps

1. Create two Vercel projects, one for each app.
2. Set the project root to `apps/student-public` and `apps/slot-booking` respectively.
3. Add the production environment variables for each app.
4. Configure custom domains if needed.
5. Deploy both projects.
6. Verify the landing page, student booking flow, and staff dashboard load against the production backend.

## Backend Deployment

Recommended target: Vercel Functions.

### Backend package

- `backend/src/index.ts` exports the Express app and only starts `listen()` when executed directly.
- `backend/api/[...path].js` wraps the compiled Express app with `serverless-http` so Vercel can route all `/api/*` requests through one function.
- `backend/vercel.json` sets a function timeout for the API handler.

### Required environment variables

Set these in the Vercel project for the backend:

- `BACKEND_PORT` - optional for local development only
- `NODE_ENV` - set to `production` in Vercel
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `FRONTEND_URL` - allow the deployed staff and student apps
- `LOG_LEVEL` - usually `info` or `warn`

### Deployment steps

1. Create a Vercel project for the backend folder.
2. Connect the GitHub repository.
3. Set the backend project root to `backend`.
4. Add the production environment variables.
5. Deploy the project.
6. Verify `GET /api/health` returns `200`.
7. Verify authenticated routes work with a production JWT and Supabase connection.

### Notes

- The backend uses the Supabase service role key on the server only.
- Do not expose secrets in frontend environment variables.
- If you deploy the frontends separately, point `NEXT_PUBLIC_BACKEND_URL` and `REACT_APP_BACKEND_URL` at the backend URL.
- For the staff app, also set `NEXT_PUBLIC_BATCH_LINK_BASE` to the deployed booking domain.

## Monitoring and Alerts

This repository includes a scheduled uptime monitor workflow at `.github/workflows/uptime-monitor.yml`.

### What it checks

- Backend health endpoint (`/api/health`)
- Backend readiness endpoint (`/api/ready`)
- Student app root URL
- Staff app root URL

### Quick post-deploy smoke test

Run this from the repository root after deployment:

`BACKEND_URL=https://api.example.com STUDENT_APP_URL=https://book.example.com STAFF_APP_URL=https://staff.example.com npm run smoke:test`

You can optionally pass `BATCH_PATH=/batch/<known-batch-id>` to validate a real student booking link.

### Required GitHub secrets

- `BACKEND_HEALTHCHECK_URL`
- `BACKEND_READINESS_URL`
- `STUDENT_APP_URL`
- `STAFF_APP_URL`

Optional:

- `ALERT_WEBHOOK_URL` to send notifications when checks fail.

### Recommended alerting

- Route webhook messages to a team Slack or Teams channel.
- Configure on-call escalation in your incident tool for repeated failures.
- Keep the backend health checks lightweight and readiness checks dependency-aware (database and critical services).
