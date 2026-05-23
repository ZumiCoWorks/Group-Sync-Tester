# AFDA Booking Platform — Quick Start Guide

**Status**: Foundation complete, ready for Supabase integration  
**Last Updated**: 22 May 2026

---

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js 18+ and npm 9+
- Git
- Supabase account (free tier available at https://supabase.com)

### 1. Clone & Install

```bash
cd /Users/zumiww/Documents/AFDAWS\ Rebuild

# Copy environment templates
cp .env.example .env.local
cp backend/.env.example backend/.env.local
cp apps/student-public/.env.local.example apps/student-public/.env.local
cp apps/slot-booking/.env.local.example apps/slot-booking/.env.local

# Install all dependencies
npm install && npm run install:all
```

### 2. Set Up Supabase

1. **Create Supabase project**:
   - Go to https://supabase.com and sign up
   - Create a new project (free tier is fine)

2. **Get credentials**:
   - Project Settings → API → Copy `Postgres Project URL`, `anon public key`, `service_role key`
   - Auth → Settings → Copy `JWT Secret`

3. **Update environment files**:

   **backend/.env.local**:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   ```

   **apps/student-public/.env.local** & **apps/slot-booking/.env.local**:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   ```

4. **Run database migrations**:
   - Copy the SQL from `backend/migrations/001_initial_schema.sql`
   - In Supabase dashboard: SQL Editor → New query → Paste and run

### 3. Start Development Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 - Student Public App**:
```bash
cd apps/student-public
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3 - Slot Booking App** (optional):
```bash
cd apps/slot-booking
npm run dev
# Runs on http://localhost:3001 (or next open port)
```

---

## 📋 Test the Setup

### Verify Backend
```bash
curl http://localhost:3001/api/health
# Should return: {"status":"ok",...}
```

### Test Student Public App
1. Open http://localhost:3000
2. Enter `ABC123` as batch code
3. Should show: "Batch not found" (expected, no data yet)

### Test Slot Booking App
1. Open http://localhost:3001 (or assigned port)
2. Should display dashboard placeholder

---

## 🎯 Quick Navigation

| What | File | Purpose |
|------|------|---------|
| **PRD** | `docs/AFDA_Booking_Platform_PRD.md` | Full product requirements |
| **Implementation Plan** | `docs/IMPLEMENTATION_PLAN.md` | Phase-by-phase breakdown |
| **Backend Types** | `shared/types.ts` | TypeScript interfaces |
| **Database Schema** | `backend/migrations/001_initial_schema.sql` | SQL setup |
| **API Routes** | `backend/src/routes/` | Endpoint implementations |
| **Student UI** | `apps/student-public/src/app/` | Landing + booking pages |
| **Staff UI** | `apps/slot-booking/src/app/` | Dashboard (WIP) |

---

## 🔧 Useful npm Commands

```bash
# Root workspace commands
npm run dev:backend        # Start backend only
npm run dev:student        # Start student app only
npm run dev:staff          # Start staff app only
npm run build              # Build all packages
npm run lint               # Lint all packages
npm run type-check         # Type-check all packages

# Per-package commands
cd backend && npm run dev   # Backend in dev mode
cd apps/student-public && npm run build  # Build student app
```

---

## 📝 Next Phase: Phase 1.2 - Supabase Integration

Once database is set up, complete:

- [ ] Authentication endpoints (`POST /api/auth/login`, `/logout`)
- [ ] JWT verification middleware
- [ ] Batch creation endpoint (`POST /api/batches`)
- [ ] Test end-to-end flow: batch creation → student claim → confirmation

See `docs/IMPLEMENTATION_PLAN.md` **Phase 1.2** for detailed tasks.

---

## 🐛 Troubleshooting

**Port already in use**:
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**node_modules issues**:
```bash
rm -rf node_modules backend/node_modules apps/*/node_modules
npm install && npm run install:all
```

**Supabase connection error**:
- Verify credentials in `.env.local`
- Check firewall/VPN not blocking Supabase
- Test connection: `curl https://your-project.supabase.co/rest/v1/ -H "apikey: your-key"`

**TypeScript errors**:
```bash
npm run type-check  # Full report
npm run lint        # ESLint issues
```

---

## 📞 Support

- **Questions?** Check `docs/IMPLEMENTATION_PLAN.md` for detailed task breakdown
- **API reference?** Endpoints documented in backend code comments
- **Schema clarification?** See `backend/migrations/001_initial_schema.sql`

---

**Ready to build?** Start with Phase 1.2: Supabase integration & auth endpoints.
