import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import './globals.css';
import { authOptions } from '@/auth';
import { isAfdaEmail } from '@/lib/afda-auth';
import { AuthSessionProvider } from '@afda/auth';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SlotBookingAuthProvider } from '@/slot-booking/auth/slot-booking-auth';
import { getAssignedRole } from '@/lib/role-store';

export const metadata: Metadata = {
  title: 'AFDA Worksuite Booking',
  description: 'OPS, lecturer, tutor, and student booking surfaces.',
};

export default async function SlotBookingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const requireAuth = process.env.NODE_ENV === 'production' && process.env.DISABLE_AUTH_REDIRECTS !== 'true';

  if (!session?.user?.email || !isAfdaEmail(session.user.email)) {
    // if there's no session email, force signin. If there is an email but it's not an AFDA email,
    // allow it only when an assigned role exists (including env-driven overrides handled by getAssignedRole).
    if (requireAuth && !session?.user?.email) {
      redirect('/auth/signin?callbackUrl=%2F');
    }
  }

  const normalized = session?.user?.email?.toString().trim().toLowerCase() ?? 'demo-student@students.afda.co.za';
  const assigned = await getAssignedRole(normalized);
  const isStudent = normalized.endsWith('@students.afda.co.za');

  // If user is not an AFDA email and they don't have an assigned role (including overrides),
  // require sign-in (prevents non-AFDA accounts from accessing staff surfaces).
  if (requireAuth && !isAfdaEmail(normalized) && !assigned) {
    redirect('/auth/signin?callbackUrl=%2F');
  }

  const effectiveSession = session ?? {
    user: {
      name: 'Demo Student',
      email: normalized,
    },
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthSessionProvider>
          <FirebaseClientProvider>
            <SlotBookingAuthProvider session={effectiveSession as any}>
              {children}
            </SlotBookingAuthProvider>
          </FirebaseClientProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}