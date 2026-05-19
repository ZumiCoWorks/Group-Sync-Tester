Vercel deployment notes for apps/slot-booking

Project settings
- Root Directory: apps/slot-booking
- Framework Preset: Next.js
- Build Command: npm run build
- Install Command: npm install
- Output Directory: (leave default for Next.js)

Environment Variables (add to Vercel project -> Settings -> Environment Variables)
- NEXT_PUBLIC_FIREBASE_CONFIG: <your firebase config JSON string>
- NEXT_PUBLIC_APP_ID: <firebase app id>
- AUTH_SECRET: <nextauth secret>
- AZURE_AD_CLIENT_ID: <azure client id>
- AZURE_AD_CLIENT_SECRET: <azure client secret>
- AZURE_AD_TENANT_ID: <azure tenant id>
- NEXT_PUBLIC_AFDA_ADMIN_EMAILS: comma-separated admin emails (optional)
- MOCK_AUTH_ENABLED: true (for demo/testing; remove for production)
- NODE_ENV: production

Notes
- Configure this Vercel project separately from your Group Sync project. Point the other project to the Group Sync app's root if needed.
- Keep `MOCK_AUTH_ENABLED=true` only for testing; remove it in production to enable Azure login for staff.
- If you use Firestore, ensure the service account / rules allow writes from your server-side endpoints.

Testing
1. Deploy to a preview or production environment in Vercel.
2. Visit the Slot Booking app URL and sign in as staff (if not using mock auth).
3. Create/publish a batch and copy the share link (should be `/public/{batchId}` under the app root).
4. Open the public link in an incognito window and book a slot using name/email.

Rollback
- If login fails, set `MOCK_AUTH_ENABLED=true` in the Vercel env to allow credential fallback for testing.
