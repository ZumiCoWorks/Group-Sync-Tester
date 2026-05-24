# AFDA Booking Platform — Deployment Configuration

This directory contains configuration files for deployment and CI/CD pipelines.

## Files

- **ci-cd.yml**: GitHub Actions workflow for linting, building, and deploying to Vercel
- **uptime-monitor.yml**: Scheduled health checks for backend and frontend production URLs

## Secrets Required

Add these secrets to your GitHub repository settings:

- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID_BACKEND`: Project ID for the backend API on Vercel
- `VERCEL_PROJECT_ID_STUDENT`: Project ID for Student Public App on Vercel
- `VERCEL_PROJECT_ID_STAFF`: Project ID for Slot Booking App on Vercel
- `PRODUCTION_BACKEND_URL`: Production backend URL (e.g., https://api.example.com)
- `BACKEND_HEALTHCHECK_URL`: Backend health endpoint URL (e.g., https://api.example.com/api/health)
- `BACKEND_READINESS_URL`: Backend readiness endpoint URL (e.g., https://api.example.com/api/ready)
- `STUDENT_APP_URL`: Production student app URL
- `STAFF_APP_URL`: Production staff app URL
- `ALERT_WEBHOOK_URL`: Optional webhook for failure notifications (Slack/Teams/Discord)

## Backend deployment note

The backend project is linked with `rootDirectory: backend`, so CI must deploy it from the repository root. Do not run Vercel from inside `backend/`, or the CLI will resolve the path as `backend/backend` and fail.

## Local Development

See the main [README.md](../README.md) for local setup instructions.
