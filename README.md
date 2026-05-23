# AFDA Booking Platform — Implementation

> Implementation of the AFDA Booking Platform as per PRD v1.0 (22 May 2026).

## Project Structure

```
.
├── backend/                          # Shared Node.js/Express backend service
│   ├── src/
│   │   ├── api/                      # Express routes (batches, bookings, venues, audit, auth)
│   │   ├── db/                       # Supabase client and database schema
│   │   ├── middleware/               # Auth, error handling, logging
│   │   ├── services/                 # Business logic (booking, batch, venue, etc.)
│   │   ├── types.ts                  # TypeScript interfaces (shared with apps)
│   │   └── index.ts                  # Entry point
│   ├── package.json
│   ├── .env.example
│   └── tsconfig.json
│
├── apps/
│   ├── student-public/               # Student Public App (Next.js)
│   │   ├── src/
│   │   │   ├── pages/                # Route pages
│   │   │   ├── components/           # Reusable UI components
│   │   │   ├── api/                  # Client-side API helpers
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── styles/               # Global styles
│   │   │   └── types.ts
│   │   ├── package.json
│   │   ├── .env.local.example
│   │   └── next.config.js
│   │
│   └── slot-booking/                 # Slot Booking App (Next.js)
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── api/
│       │   ├── hooks/
│       │   ├── styles/
│       │   ├── contexts/             # Auth, batch, booking contexts
│       │   └── types.ts
│       ├── package.json
│       ├── .env.local.example
│       └── next.config.js
│
├── shared/                           # Shared types, utilities, components
│   ├── types.ts                      # TypeScript interfaces (batches, bookings, users, etc.)
│   ├── constants.ts                  # Status enums, magic strings
│   ├── utils.ts                      # Helper functions (date formatting, validation, etc.)
│   └── package.json
│
├── docs/
│   ├── AFDA_Booking_Platform_PRD.md  # Product Requirements Document
│   ├── API.md                        # Backend API specification
│   ├── DATABASE_SCHEMA.md            # Supabase schema and migrations
│   ├── DEPLOYMENT.md                 # Vercel, Supabase, environment setup
│   └── IMPLEMENTATION_PLAN.md        # Detailed task breakdown
│
├── package.json                      # Root workspace config (if using monorepo tools)
└── .env.example                      # Example env vars for local development

```

## Tech Stack

| Component | Technology |
|-----------|-------------|
| Backend | Node.js 18+ / Express / TypeScript |
| Frontend | Next.js 14+ / React 18+ / TypeScript |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel (frontend apps + backend Functions) |
| Auth | Supabase Auth or external SSO (configurable) |
| Real-time | Supabase Real-time subscriptions |

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier available)
- Vercel account (free tier available)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   cd /Users/zumiww/Documents/AFDAWS\ Rebuild
   npm install  # if using workspace

   cd backend && npm install
   cd ../apps/student-public && npm install
   cd ../apps/slot-booking && npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Fill in Supabase credentials, API keys, etc.
   ```

3. **Initialize Supabase database:**
   - Create a new Supabase project
   - Run migrations (detailed in `docs/DATABASE_SCHEMA.md`)
   - Seed test data (optional)

4. **Start backend:**
   ```bash
   cd backend
   npm run dev
   # API will be available at http://localhost:3001
   ```

5. **Start frontend apps (in separate terminals):**
   ```bash
   cd apps/student-public
   npm run dev
   # App at http://localhost:3000

   cd apps/slot-booking
   npm run dev
   # App at http://localhost:3001 (if using dev proxy, or separate port)
   ```

## MVP Timeline

**Phase 1: Foundation** (Week 1–2)
- [ ] Backend API scaffolding (Express, Supabase, auth)
- [ ] Database schema (batches, bookings, users, audit logs)
- [ ] Shared types and utilities

**Phase 2: Student Public App** (Week 2–3)
- [ ] Landing page with batch ID entry
- [ ] Booking page (slots list, claim button)
- [ ] Confirmation page and email
- [ ] Error handling

**Phase 3: Slot Booking App** (Week 2–4)
- [ ] Dashboard (list batches)
- [ ] Batch editor (create, edit, publish)
- [ ] Booking management (view, cancel)
- [ ] XLSX import (basic validation)
- [ ] PDF export

**Phase 4: Integration & Testing** (Week 4–5)
- [ ] End-to-end testing (batch creation → student claim → export)
- [ ] Performance and load testing
- [ ] Security review

**Phase 5: Deployment** (Week 5)
- [ ] Deploy backend to Vercel Functions or separate server
- [ ] Deploy Student Public App to Vercel
- [ ] Deploy Slot Booking App to Vercel
- [ ] Configure DNS and SSL

## Key Documentation

- **[PRD](docs/AFDA_Booking_Platform_PRD.md)**: Full product requirements.
- **[API Specification](docs/API.md)**: Backend endpoint contracts.
- **[Database Schema](docs/DATABASE_SCHEMA.md)**: Supabase tables, migrations, audit logging.
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Vercel, Supabase, environment variables.
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)**: Detailed task breakdown by phase.

## Development Workflow

1. **Create a branch** for each feature/app.
2. **Write code** with TypeScript and test locally.
3. **Push to GitHub** and create a Pull Request.
4. **Run CI/CD** (GitHub Actions) to lint, test, and build preview.
5. **Review and merge** to main branch.
6. **Deploy** to staging/production via Vercel.

## Deployment Independence

Each app can be deployed independently:

- **Student Public App** deploys to `student.app.example.com` (or `https://app.example.com`)
- **Slot Booking App** deploys to `staff.app.example.com` (or `https://booking.app.example.com`)
- **Backend API** deploys to `api.app.example.com` (or Vercel Functions under same domain)

All apps share the same Supabase instance and base URL for API calls.

## Support & Questions

For questions or issues, refer to:
- `docs/IMPLEMENTATION_PLAN.md` for task breakdown
- `docs/API.md` for backend endpoints
- `docs/DATABASE_SCHEMA.md` for data model

---

**Last Updated**: 22 May 2026  
**Status**: Initial Setup Phase
