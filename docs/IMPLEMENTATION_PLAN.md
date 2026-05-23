# AFDA Booking Platform — Implementation Plan

**Version**: 1.0  
**Date**: 22 May 2026  
**Target Timeline**: 5 weeks to MVP  

---

## Overview

The implementation follows a phased approach:

1. **Foundation** (Week 1–2): Backend API, database, shared types
2. **Student Public App** (Week 2–3): Landing, batch entry, booking flow
3. **Slot Booking App** (Week 3–4): Dashboard, batch management, exports
4. **Integration & Testing** (Week 4–5): End-to-end, performance, security
5. **Deployment** (Week 5): Vercel, Supabase, production setup

---

## Phase 1: Foundation (Weeks 1–2)

### 1.1 Backend Setup

**Tasks:**
- [ ] Initialize Node.js/Express project
  - [ ] Set up TypeScript, ESLint, Prettier
  - [ ] Configure Express middleware (CORS, logging, error handling)
  - [ ] Set up environment variable loading (.env)
- [ ] Connect to Supabase
  - [ ] Create Supabase project
  - [ ] Set up Supabase client (JS SDK)
  - [ ] Configure JWT authentication
- [ ] Create API structure
  - [ ] `/api/auth/*` — Login, logout, role assignment
  - [ ] `/api/batches/*` — CRUD batches
  - [ ] `/api/bookings/*` — Create, cancel, reassign bookings
  - [ ] `/api/venues/*` — CRUD venues
  - [ ] `/api/audit/*` — List audit logs
  - [ ] `/api/health` — Health check endpoint

**Deliverables:**
- [ ] Backend running locally on http://localhost:3001
- [ ] Express routes with placeholder handlers
- [ ] Supabase connection verified
- [ ] TypeScript build succeeds

**Acceptance Criteria:**
- [ ] `GET /api/health` returns `{ "status": "ok" }`
- [ ] All routes respond with 200 (no business logic yet)
- [ ] No TypeScript errors

---

### 1.2 Database Schema (Supabase)

**Tasks:**
- [ ] Create tables:
  - [ ] `users` (id, email, firstName, lastName, role, domain, createdAt)
  - [ ] `batches` (id, title, description, createdByUserId, status, venueId, dateRange, slotDuration, perSlotCapacity, batchCapacity, bookingCount, totalSlots, createdAt, publishedAt, updatedAt)
  - [ ] `slots` (id, batchId, startTime, endTime, capacity, bookingCount, createdAt, updatedAt)
  - [ ] `bookings` (id, slotId, batchId, studentName, studentEmail, studentId_external, status, confirmationNumber, bookedAt, createdAt, updatedAt, markedAttendedat)
  - [ ] `venues` (id, name, address, capacity, facilities, contactEmail, contactPhone, opsOwnerId, createdAt, updatedAt)
  - [ ] `venue_availability` (id, venueId, dayOfWeek, startTime, endTime, isAvailable, createdAt, updatedAt)
  - [ ] `blackout_windows` (id, venueId, startDate, endDate, reason, createdAt, updatedAt)
  - [ ] `venue_booking_requests` (id, batchId, venueId, requestedByUserId, status, declineReason, createdAt, respondedAt, respondedByUserId, updatedAt)
  - [ ] `audit_logs` (id, userId, action, resourceType, resourceId, details, changes, ipAddress, userAgent, createdAt)
  - [ ] `import_jobs` (id, batchId, createdByUserId, totalRows, successCount, errorCount, status, errors, startedAt, completedAt, createdAt)
  - [ ] `notifications` (id, userId, type, title, message, actionUrl, isRead, createdAt)

- [ ] Set up indexes
  - [ ] `batches (createdByUserId, status, publishedAt)`
  - [ ] `bookings (slotId, batchId, studentEmail, status)`
  - [ ] `audit_logs (userId, resourceId, createdAt)`
  - [ ] `slots (batchId, startTime)`

- [ ] Set up Row-Level Security (RLS) policies
  - [ ] Students can only view published batches
  - [ ] Staff can only edit batches they created
  - [ ] Ops can only approve venues they own
  - [ ] Admin can view all data

- [ ] Create database migration files
  - [ ] `migrations/001_initial_schema.sql`

**Deliverables:**
- [ ] All tables created and verified in Supabase
- [ ] Indexes created
- [ ] RLS policies applied
- [ ] Migration files ready for version control

**Acceptance Criteria:**
- [ ] `SELECT * FROM batches LIMIT 1` succeeds
- [ ] Test insert into `users` succeeds with RLS
- [ ] Queries have <100ms response time on empty tables

---

### 1.3 Shared Types & Utilities

**Tasks:**
- [ ] `shared/types.ts` — Export all TypeScript interfaces (User, Batch, Slot, Booking, etc.) ✓ Already created
- [ ] `shared/constants.ts` — Define enums and magic strings
  - [ ] `USER_ROLES`, `BATCH_STATUS`, `BOOKING_STATUS`, `AUDIT_ACTIONS`
  - [ ] `HTTP_STATUS_CODES`, `ERROR_CODES`
- [ ] `shared/utils.ts` — Helper functions
  - [ ] `formatDate(date: Date): string`
  - [ ] `validateEmail(email: string): boolean`
  - [ ] `generateConfirmationNumber(): string`
  - [ ] `calculateSlotCapacity(batchCapacity, slotCount): number`
  - [ ] `checkRolePermission(userRole, action): boolean`

**Deliverables:**
- [ ] `shared/package.json` configured
- [ ] All types exportable from `@shared/types`
- [ ] Constants and utils tested locally

**Acceptance Criteria:**
- [ ] `import { User, Batch } from '@shared/types'` works in backend and frontend
- [ ] All utility functions have unit tests (or at least execute without error)

---

## Phase 2: Student Public App (Weeks 2–3)

### 2.1 Project Setup

**Tasks:**
- [ ] Initialize Next.js project (React-based)
  - [ ] `npx create-next-app@latest student-public --typescript --tailwind`
  - [ ] Configure environment variables (NEXT_PUBLIC_BACKEND_URL)
  - [ ] Set up API client (axios or fetch wrapper)
- [ ] Create folder structure
  - [ ] `src/pages/` — Batch entry, booking, confirmation
  - [ ] `src/components/` — Reusable UI (landing, slots list, etc.)
  - [ ] `src/api/` — Client API helpers
  - [ ] `src/hooks/` — Custom hooks (useBooking, useQuery, etc.)
  - [ ] `src/styles/` — Global styles (Tailwind)

**Deliverables:**
- [ ] Next.js project running at http://localhost:3000
- [ ] TypeScript configured
- [ ] Environment variables set up

**Acceptance Criteria:**
- [ ] `npm run dev` starts server without errors
- [ ] Placeholder pages render

---

### 2.2 Landing Page

**Tasks:**
- [ ] Design landing page layout
  - [ ] Hero section with CTA
  - [ ] Batch ID input field
  - [ ] "Enter Batch Code" button
  - [ ] Mobile-responsive layout
- [ ] Implement batch lookup
  - [ ] POST `/api/batches/:batchId/verify` — Check if batch exists and is published
  - [ ] On success, redirect to `/batch/:batchId`
  - [ ] On error, show friendly message (invalid ID, expired, etc.)
- [ ] Implement deep linking support
  - [ ] If URL is `/batch/:batchId`, fetch batch and show booking page directly
- [ ] Handle errors
  - [ ] Invalid batch ID
  - [ ] Expired batch
  - [ ] Network errors with retry prompt

**Deliverables:**
- [ ] Landing page on `/` displays correctly
- [ ] Batch lookup works and redirects to booking page
- [ ] Deep links (`/batch/ABC123`) work on mobile and desktop
- [ ] Error messages are user-friendly

**Acceptance Criteria:**
- [ ] User enters valid batch ID and lands on booking page within 2 seconds
- [ ] Deep link opens booking page without requiring ID entry
- [ ] All error messages are actionable

---

### 2.3 Booking Page

**Tasks:**
- [ ] Fetch and display batch metadata
  - [ ] GET `/api/batches/:batchId` — Fetch batch details (title, tutor, venue, date)
  - [ ] Batch title, description, tutor name, venue
- [ ] Fetch and display available slots
  - [ ] GET `/api/slots?batchId=:batchId` — List all slots with availability
  - [ ] For each slot: date/time, capacity remaining, claim button
- [ ] Implement claim button
  - [ ] POST `/api/bookings` — Create booking for selected slot
  - [ ] Request body: `{ slotId, studentName, studentEmail }`
  - [ ] On success, show confirmation page
  - [ ] On error (slot full, race condition), show error and reload slots
- [ ] Visual feedback
  - [ ] Disable button for full/expired slots
  - [ ] Loading spinner during claim
  - [ ] Toast notification on success/error

**Deliverables:**
- [ ] Booking page displays batch + available slots
- [ ] Claim button functional and atomic (no double-booking)
- [ ] Error handling for edge cases

**Acceptance Criteria:**
- [ ] Batch loads within 2s; slots display immediately
- [ ] Claim succeeds and shows confirmation
- [ ] No double-booking even on rapid clicks
- [ ] Full slots are clearly marked

---

### 2.4 Confirmation Page

**Tasks:**
- [ ] Display confirmation details
  - [ ] Confirmation number
  - [ ] Slot date/time
  - [ ] Batch title
  - [ ] Tutor contact info (email/phone)
- [ ] Send confirmation email
  - [ ] POST `/api/notifications/email` with booking details
  - [ ] Email includes: confirmation number, slot time, tutor contact
  - [ ] Email sent asynchronously (doesn't block page load)
- [ ] Add action buttons
  - [ ] "View batch" (back to booking page)
  - [ ] "Copy confirmation" (copy number to clipboard)
  - [ ] "Share" (share batch link with friend)

**Deliverables:**
- [ ] Confirmation page renders with booking details
- [ ] Email sent within 5 seconds
- [ ] Copy and share functionality work

**Acceptance Criteria:**
- [ ] Confirmation number is unique and matches backend
- [ ] Email arrives within 5 minutes
- [ ] User can easily share batch link

---

### 2.5 Error Handling & Mobile Optimization

**Tasks:**
- [ ] Error messages
  - [ ] Invalid batch ID: "Sorry, we couldn't find that batch…"
  - [ ] Expired batch: "This batch is no longer available…"
  - [ ] Full batch: "All slots are claimed…"
  - [ ] Network error: "Connection lost. Refresh to try again…"
- [ ] Mobile optimization
  - [ ] Single-column layout for all pages
  - [ ] Touch-friendly buttons (min 48px)
  - [ ] Responsive images and text
  - [ ] Tested on iPhone SE (375px) and iPad (768px)
- [ ] Accessibility (WCAG 2.1 AA)
  - [ ] Keyboard navigation (Tab through buttons)
  - [ ] Screen reader support (semantic HTML, ARIA labels)
  - [ ] Color contrast ≥4.5:1 for text

**Deliverables:**
- [ ] All error scenarios tested and messages display
- [ ] Mobile layout verified on multiple devices/screen sizes
- [ ] Accessibility audit passed

**Acceptance Criteria:**
- [ ] All errors are actionable
- [ ] Mobile page width scales correctly
- [ ] Lighthouse accessibility score ≥90

---

## Phase 3: Slot Booking App (Weeks 3–4)

### 3.1 Project Setup & Authentication

**Tasks:**
- [ ] Initialize Next.js project (similar to Student Public App)
  - [ ] `npx create-next-app@latest slot-booking --typescript --tailwind`
- [ ] Set up authentication
  - [ ] Implement login page with SSO (Google, Microsoft, or custom)
  - [ ] POST `/api/auth/login` — Validates SSO token and creates session
  - [ ] Implement logout
  - [ ] Auth guard: Redirect to login if not authenticated
  - [ ] Role check: Only allow staff, lecturer, ops, admin

**Deliverables:**
- [ ] Login page works with SSO
- [ ] Protected routes redirect to login if unauthenticated
- [ ] User role verified on backend

**Acceptance Criteria:**
- [ ] User logs in and is redirected to dashboard
- [ ] Non-staff users are rejected
- [ ] Session persists across page refreshes

---

### 3.2 Dashboard

**Tasks:**
- [ ] Fetch and display batches
  - [ ] GET `/api/batches?createdBy=:userId` — List user's batches
  - [ ] Filter by status: Drafts, Published, Archived
  - [ ] For each batch: title, status badge, slot count, booking count, last updated
- [ ] Search and filter
  - [ ] Search by title
  - [ ] Filter by date range
  - [ ] Filter by venue
- [ ] Quick actions
  - [ ] Edit, Preview, Publish, View Bookings, Export, Archive buttons
- [ ] Create new batch
  - [ ] Button to navigate to batch editor

**Deliverables:**
- [ ] Dashboard displays user's batches
- [ ] Search and filter functional
- [ ] Quick action buttons navigate to correct pages

**Acceptance Criteria:**
- [ ] Dashboard loads within 2s
- [ ] User can see all their batches
- [ ] Search and filter reduce results correctly

---

### 3.3 Batch Editor

**Tasks:**
- [ ] New batch form
  - [ ] Fields: title, description, venue, date range, slot duration, per-slot capacity, batch capacity
  - [ ] Multi-date generation (optional for MVP)
    - [ ] Option to select weekdays + time
    - [ ] Preview generated slots before save
  - [ ] Save as draft
- [ ] Edit existing batch
  - [ ] Load batch data into form
  - [ ] Allow editing if batch is in draft status
  - [ ] Warn if batch is published (changes require re-publish)
  - [ ] Save changes
- [ ] Validation
  - [ ] Title required
  - [ ] Date range valid (start < end)
  - [ ] Venue selected if required
  - [ ] Slot duration > 0
  - [ ] Show validation errors inline
- [ ] Store logic
  - [ ] POST `/api/batches` — Create new batch
  - [ ] PUT `/api/batches/:batchId` — Update batch
  - [ ] Generated slots saved to database

**Deliverables:**
- [ ] Batch editor form renders
- [ ] New batches created and saved
- [ ] Existing batches can be edited (if draft)
- [ ] Slots generated correctly

**Acceptance Criteria:**
- [ ] User creates batch with 5 slots and can view in dashboard
- [ ] Multi-date generation creates 15 slots for Mon-Fri, 3 weeks
- [ ] Validation prevents invalid submissions
- [ ] Slots are atomically saved (all or nothing)

---

### 3.4 Publish Workflow

**Tasks:**
- [ ] Preview page
  - [ ] Display all slots, capacity, batch settings
  - [ ] Show batch link (for copying)
  - [ ] Show QR code (generated on backend)
- [ ] Publish step
  - [ ] If venue requires approval, show "Awaiting Venue Approval" status
  - [ ] Otherwise, batch becomes immediately published
  - [ ] POST `/api/batches/:batchId/publish` — Publish batch
  - [ ] On success, show confirmation + live batch link
- [ ] Share options
  - [ ] Copy link to clipboard
  - [ ] Email link to participants (optional)
  - [ ] Generate QR code (downloadable as PNG)

**Deliverables:**
- [ ] Preview page shows all batch details
- [ ] Publish button transitions batch to published state
- [ ] Batch link and QR code displayed

**Acceptance Criteria:**
- [ ] Published batch appears in "Published" tab on dashboard
- [ ] Batch link works for students
- [ ] QR code scans to batch link on mobile

---

### 3.5 Booking Management

**Tasks:**
- [ ] View bookings page
  - [ ] GET `/api/bookings?batchId=:batchId` — List all bookings for batch
  - [ ] Table: student name, email, booking date, status, actions
  - [ ] Filter by status (confirmed, waitlisted, attended, cancelled)
- [ ] Cancel booking
  - [ ] DELETE `/api/bookings/:bookingId` — Cancel booking
  - [ ] Confirm before deleting
  - [ ] Slot capacity freed immediately
  - [ ] Toast notification on success
- [ ] Mark attended
  - [ ] PUT `/api/bookings/:bookingId` — Update booking status to "attended"
  - [ ] Visual feedback (checkmark, color change)
- [ ] Reassign booking (nice-to-have for MVP)
  - [ ] Move student to different slot (if available)

**Deliverables:**
- [ ] Bookings page displays all bookings
- [ ] Cancel button works and frees slot
- [ ] Mark attended functionality works

**Acceptance Criteria:**
- [ ] User can cancel a booking and see capacity decrease
- [ ] Cancelled booking removed from "Confirmed" list
- [ ] Audit log records cancellation

---

### 3.6 Imports (XLSX)

**Tasks:**
- [ ] Import form
  - [ ] File upload (accept `.xlsx`)
  - [ ] Validation: Check for required columns (first_name, last_name, email)
- [ ] Validate rows
  - [ ] Check for duplicates within file
  - [ ] Check for existing bookings (conflicts)
  - [ ] Show error summary before commit
  - [ ] Allow partial commit (import valid rows, hold invalid)
- [ ] Import process
  - [ ] POST `/api/imports` — Start import job
  - [ ] Chunked processing (batch 50 rows at a time)
  - [ ] Show real-time progress: "Importing: 300/500 complete"
- [ ] Post-import
  - [ ] Show count of successfully imported
  - [ ] Show count of errors
  - [ ] Provide download link for error report (CSV)
  - [ ] Auto-send invitation emails to imported participants

**Deliverables:**
- [ ] Import form accepts XLSX
- [ ] Validation displays errors
- [ ] Import succeeds and creates bookings
- [ ] Progress shown in real-time
- [ ] Errors downloadable

**Acceptance Criteria:**
- [ ] User imports 500-row XLSX and completes in <15s
- [ ] All valid rows imported
- [ ] Errors clearly explained
- [ ] Can download error report

---

### 3.7 Exports (PDF / XLSX)

**Tasks:**
- [ ] PDF export
  - [ ] GET `/api/exports?batchId=:batchId&format=pdf` — Generate PDF
  - [ ] PDF shows: batch title, date, slot details, attendee list
  - [ ] Print-friendly layout (black and white, no colors)
  - [ ] One page per session/slot (or multi-page batch view)
- [ ] XLSX export
  - [ ] GET `/api/exports?batchId=:batchId&format=xlsx` — Generate XLSX
  - [ ] Columns: session_id, session_date, session_time, student_name, student_email, status, attended
  - [ ] One row per booking
- [ ] Clipboard copy
  - [ ] Button to copy attendee list (name + email) to clipboard
  - [ ] Format: CSV-style for pasting into email
- [ ] Download flow
  - [ ] Generate file on backend
  - [ ] Return download URL
  - [ ] File expires after 24 hours
  - [ ] Frontend triggers browser download

**Deliverables:**
- [ ] PDF export renders correctly
- [ ] XLSX export opens in Excel/Google Sheets
- [ ] Clipboard copy formats data correctly

**Acceptance Criteria:**
- [ ] PDF is printable and all text visible
- [ ] XLSX opens and has all required columns
- [ ] Export data matches UI display
- [ ] All bookings included (even if many)

---

### 3.8 Audit Log

**Tasks:**
- [ ] View audit log page
  - [ ] GET `/api/audit-logs?batchId=:batchId` — List all actions for batch
  - [ ] Table: timestamp, user, action, details
  - [ ] Filter by action type (created, published, edited, etc.)
  - [ ] Pagination (25 items per page)
- [ ] Export audit log
  - [ ] Button to export as CSV
  - [ ] GET `/api/exports?resourceId=:batchId&resourceType=batch&format=audit_csv`
  - [ ] CSV includes all audit fields

**Deliverables:**
- [ ] Audit log page displays all actions
- [ ] Export to CSV works
- [ ] Immutable (read-only in UI)

**Acceptance Criteria:**
- [ ] All publish, edit, and cancel actions logged
- [ ] Timestamps accurate
- [ ] Export CSV valid and readable

---

## Phase 4: Integration & Testing (Week 4–5)

### 4.1 End-to-End Testing

**Tasks:**
- [ ] Test full user journey
  - [ ] Tutor creates batch → publishes → provides link to student
  - [ ] Student uses link → books slot → receives confirmation
  - [ ] Tutor views bookings → exports PDF → marks attended
- [ ] Test error scenarios
  - [ ] Late booking (slot full)
  - [ ] Concurrent claims on final slot (only one wins)
  - [ ] Network flakiness (retry logic)
  - [ ] Invalid batch ID
- [ ] Test data integrity
  - [ ] No double-booking
  - [ ] Capacity never exceeded
  - [ ] Exports match database

**Deliverables:**
- [ ] End-to-end test suite (manual checklist + automated tests)
- [ ] All happy paths verified
- [ ] All error paths handled

**Acceptance Criteria:**
- [ ] Complete journey works without manual intervention
- [ ] All error cases handled gracefully
- [ ] Data integrity maintained

---

### 4.2 Performance Testing

**Tasks:**
- [ ] Load testing
  - [ ] Simulate 100 concurrent users booking slots
  - [ ] Measure: response time, throughput, errors
  - [ ] Target: p50 ≤500ms, p95 ≤2s
- [ ] Batch loading
  - [ ] Measure time from batch ID entry to slots visible
  - [ ] Target: ≤2 seconds on 4G
- [ ] Import performance
  - [ ] Import 500-row file
  - [ ] Target: ≤15 seconds total
- [ ] Database query optimization
  - [ ] Verify indexes are used
  - [ ] Check slow query log
  - [ ] Optimize N+1 queries

**Deliverables:**
- [ ] Performance test results
- [ ] Optimization recommendations
- [ ] Load test report

**Acceptance Criteria:**
- [ ] Batch loading: ≤2s
- [ ] Booking success: ≥98% under normal load
- [ ] No N+1 queries
- [ ] Import: ≤15s for 500 rows

---

### 4.3 Security Review

**Tasks:**
- [ ] Authentication
  - [ ] Verify SSO integration works
  - [ ] Check JWT expiry and refresh logic
  - [ ] Test role-based access (staff can't access ops functions)
- [ ] Data protection
  - [ ] Verify HTTPS in use
  - [ ] Check environment variables are not exposed
  - [ ] Verify PII is minimized
- [ ] API security
  - [ ] Rate limiting enforced (100 req/min per user)
  - [ ] CORS configured correctly
  - [ ] SQL injection prevention (parameterized queries)
  - [ ] Test unauthorized access (401 / 403 errors)
- [ ] Audit logging
  - [ ] Verify all critical actions logged
  - [ ] Check audit logs are immutable
  - [ ] Test sensitive data is not exposed in logs

**Deliverables:**
- [ ] Security checklist completed
- [ ] Issues documented and prioritized
- [ ] Fixes applied

**Acceptance Criteria:**
- [ ] No critical security vulnerabilities
- [ ] All access is role-based
- [ ] Audit logs record all sensitive actions

---

## Phase 5: Deployment (Week 5)

### 5.1 Environment Setup

**Tasks:**
- [ ] Production Supabase instance
  - [ ] Create Supabase project (prod)
  - [ ] Run database migrations
  - [ ] Set up connection pooling
  - [ ] Configure backups
- [ ] Environment variables
  - [ ] `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_BACKEND_URL` for frontend apps
  - [ ] Email provider credentials (SendGrid, AWS SES, etc.)
  - [ ] SSO credentials (if using external provider)
- [ ] DNS setup
  - [ ] Point domain to Vercel
  - [ ] Configure subdomains (optional)
  - [ ] SSL certificate auto-provisioned by Vercel

**Deliverables:**
- [ ] Production Supabase instance ready
- [ ] All env vars configured
- [ ] DNS pointing to Vercel

**Acceptance Criteria:**
- [ ] All environment variables validated
- [ ] No secrets in code
- [ ] SSL certificate valid

---

### 5.2 Backend Deployment

**Tasks:**
- [ ] Choose deployment model
  - [ ] Option A: Vercel Functions (serverless, scalable)
  - [ ] Option B: Separate Node.js server (Railway, Render, DigitalOcean, etc.)
  - [ ] **Recommended**: Vercel Functions (same platform as frontend)
- [ ] Deploy backend
  - [ ] Push code to GitHub
  - [ ] Connect Vercel to GitHub project
  - [ ] Set production environment variables in Vercel
  - [ ] Deploy: `vercel --prod`
- [ ] Verify deployment
  - [ ] `GET https://api.example.com/api/health` returns 200
  - [ ] Database connections work
  - [ ] Email sending works (send test email)

**Deliverables:**
- [ ] Backend API live at `https://api.example.com`
- [ ] All endpoints responsive
- [ ] Error tracking enabled (e.g., Sentry)

**Acceptance Criteria:**
- [ ] Health check passes
- [ ] No 5xx errors on startup
- [ ] Database and external services reachable

---

### 5.3 Frontend Deployment

**Tasks:**
- [ ] Deploy Student Public App
  - [ ] Push to GitHub
  - [ ] Connect Vercel to repo
  - [ ] Set `NEXT_PUBLIC_BACKEND_URL=https://api.example.com`
  - [ ] Deploy: `vercel --prod`
  - [ ] Verify at `https://app.example.com` or custom domain
- [ ] Deploy Slot Booking App
  - [ ] Same process as above
  - [ ] Verify at `https://staff.example.com` or custom domain
- [ ] Test both apps end-to-end in production
  - [ ] Student: land, book slot, confirm
  - [ ] Staff: create batch, view bookings, export

**Deliverables:**
- [ ] Both apps live on Vercel
- [ ] Custom domains configured (if applicable)
- [ ] SSL certificates valid

**Acceptance Criteria:**
- [ ] Both apps load without errors
- [ ] All endpoints responsive
- [ ] User journeys work end-to-end

---

### 5.4 Monitoring & Alerts

**Tasks:**
- [ ] Error tracking
  - [ ] Set up Sentry or similar (error reporting)
  - [ ] Alert on critical errors (5xx, untaught exceptions)
- [ ] Performance monitoring
  - [ ] Set up APM (Vercel Analytics, New Relic, DataDog, etc.)
  - [ ] Monitor response times, load, database queries
  - [ ] Alert if p95 latency > 2s
- [ ] Logging
  - [ ] Centralize backend logs (e.g., Supabase logs)
  - [ ] Set up log rotation
  - [ ] Archive logs for compliance
- [ ] Uptime monitoring
  - [ ] Ping health check every 5 minutes
  - [ ] Alert if downtime

**Deliverables:**
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Alerting rules set up

**Acceptance Criteria:**
- [ ] Errors reported automatically
- [ ] Performance metrics visible
- [ ] Team notified of issues

---

## Post-MVP: Group Sync & Venue Booking Apps

### Post-MVP Phase 1: Group Sync (Week 6–7)

**TODO**: Define Group Sync implementation plan (follows same structure as above).

---

### Post-MVP Phase 2: Venue Booking (Week 8–9)

**TODO**: Define Venue Booking implementation plan (follows same structure as above).

---

## Key Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Foundation complete (backend, DB, types) | End of Week 2 | Not Started |
| Student Public App MVP | End of Week 3 | Not Started |
| Slot Booking App MVP | End of Week 4 | Not Started |
| Integration & security testing | End of Week 4 | Not Started |
| Production deployment | End of Week 5 | Not Started |

---

## Dependencies & Risks

### Critical Dependencies
- Supabase project creation and configuration
- SSO / authentication provider setup
- Email service provider (SendGrid, AWS SES, etc.)
- Vercel account and GitHub integration

### Risks
- **Concurrency in booking**: May require database-level optimistic locking
- **Large imports**: Streaming upload may require multipart form handling
- **Performance under load**: May need caching (Redis) or CDN
- **Scope creep**: Multi-date generation, QR codes, integrations might slip to post-MVP

### Mitigations
- Early stress testing on concurrency
- Implement import chunking from start
- Use Vercel's built-in caching and CDN
- Strict MVP boundary enforcement

---

## Success Criteria (MVP Launch)

- [ ] All 5 phases complete
- [ ] Booking success rate ≥98% under load
- [ ] Batch loading ≤2s on mobile (4G)
- [ ] Zero database integrity violations (no overbooking)
- [ ] All critical actions audited
- [ ] Security review passed
- [ ] Team trained on deployment and monitoring
- [ ] Documentation complete and up-to-date

---

**Document Owner**: Development Lead  
**Last Updated**: 22 May 2026  
**Next Review**: Weekly (Frida EOD)
