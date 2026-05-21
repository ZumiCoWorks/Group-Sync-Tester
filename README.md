# AFDA Workspace

This workspace contains three AFDA-facing apps built on a shared Next.js + Firebase stack:

- Group Sync at `/group-sync`
- Venue Booking at `/venue-booking`
- Slot Booking at `/slot-booking`

The apps are already split at the route level. What you still need to set up is the external infrastructure and environment configuration.

## What Is Already Built

- Separate app routes and layouts for Group Sync, Venue Booking, and Slot Booking
- Firebase-backed persistence for sessions, venues, slot batches, bookings, and audits
- Azure AD sign-in via NextAuth for the booking apps
- Tutor draft/publish workflow for slot batches
- Custom location support for slot creation
- Published-slot filtering on the student booking view

## What You Need To Set Up

### 1. Firebase Project

Create or connect a Firebase project and enable:

- Firestore
- Authentication if you want Firebase services beyond the current client wrapper

Then paste the Firebase config JSON into your env file.

Required environment values:

- `NEXT_PUBLIC_FIREBASE_CONFIG`
- `NEXT_PUBLIC_APP_ID`

### 2. Azure AD Application

Register an Azure AD app for authentication and collect:

- Client ID
- Client Secret
- Tenant ID

Required environment values:

- `AZURE_AD_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET`
- `AZURE_AD_TENANT_ID`
- `AUTH_SECRET`

### 3. Allowed Email Domains

Set the allowed email domains for staff and students.

You can use one shared allowlist or separate domains.

Example:

- `AFDA_ALLOWED_EMAIL_DOMAINS="staff.afda.co.za,students.afda.co.za"`

If you do not set the shared allowlist, the app falls back to the staff/student domain env vars.

### 4. Firestore Data Separation

The app uses a shared backend namespace, but the data is separated by collection.

You should verify:

- venue data is going into the venue booking collections
- slot batches and slots are going into the slot booking collections
- student bookings remain tied to published slots only

### 5. Deployment Environment Variables

Make sure the same env values exist in:

- local development
- Vercel or your hosting platform
- any preview environments

If these are missing, the booking apps will redirect to sign-in or fail to load data correctly.

## Local Setup

1. Install dependencies.
2. Create a local `.env` file from [.env.example](.env.example).
3. Fill in Firebase and Azure AD values.
4. Run the development server.
5. Open the routes below and verify each flow.

```bash
npm install
npm run dev
```

## Routes To Verify

- `/` - AFDA app directory
- `/group-sync` - student grouping app
- `/venue-booking` - operations venue import app
- `/slot-booking` - tutor slot dashboard
- `/slot-booking/tutor` - tutor draft/publish flow
- `/slot-booking/student` - student booking flow

## Functional Checks

### Group Sync

- Create a session
- Join a room as a student
- Shuffle or group participants
- Confirm history still works

### Venue Booking

- Import a venue spreadsheet
- Confirm venue records appear in the app
- Confirm the Thursday lockout prevents late changes when appropriate

### Slot Booking

- Create a draft batch from an allocated venue
- Create a draft batch using a custom location
- Publish a batch
- Confirm only published slots appear to students
- Book a slot as a student
- Confirm the calendar invite uses the selected location label

## Important Operational Notes

- If Azure sign-in is unavailable, users who are not already authenticated will not be able to enter the booking apps.
- Published slots are the only student-visible slots.
- Draft batches stay hidden until a tutor publishes them.
- The Venue App and Slot App remain independent at the UI level and only share Firestore as a backend.

## Suggested Next Step

If you are setting this up for real use, the next thing to do is:

1. Configure the env vars.
2. Register the Azure AD app.
3. Connect Firestore.
4. Test the three app routes locally.

## Deploying As Separate Vercel Apps

Deploy `apps/slot-booking` and `apps/student-public` as two separate Vercel projects.

### 1. Slot Booking project

```bash
cd apps/slot-booking
npx vercel link
npx vercel deploy --prod
```

Recommended project settings:

- Root Directory: `apps/slot-booking`
- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Install Command: `npm install`

### 2. Student Public project

```bash
cd apps/student-public
npx vercel link
npx vercel deploy --prod
```

Recommended project settings:

- Root Directory: `apps/student-public`
- Framework Preset: `Next.js`
- Build Command: `npm run build`
- Install Command: `npm install`

### 3. Shared environment variables

Set these on both projects:

- `NEXT_PUBLIC_FIREBASE_CONFIG`
- `NEXT_PUBLIC_APP_ID`
- `AUTH_SECRET`

Set these on `apps/slot-booking` if you want staff auth in production:

- `AZURE_AD_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET`
- `AZURE_AD_TENANT_ID`

Set this on `apps/student-public` only for local/demo usage:

- `MOCK_AUTH_ENABLED=true`

For production student use, remove `MOCK_AUTH_ENABLED` so the app uses real auth behavior.
