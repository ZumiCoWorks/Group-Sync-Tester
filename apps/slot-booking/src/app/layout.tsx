import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { isAfdaEmail } from '@/lib/afda-auth';
import { SlotBookingAuthProvider } from '@/slot-booking/auth/slot-booking-auth';
import { getAssignedRole } from '@/lib/role-store';

export const metadata: Metadata = {
  title: 'AFDA Worksuite Booking',
  description: 'OPS, lecturer, tutor, and student booking surfaces.',
};

export default async function SlotBookingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAfdaEmail(session.user.email)) {
    // if there's no session email, force signin. If there is an email but it's not an AFDA email,
    // allow it only when an assigned role exists (including env-driven overrides handled by getAssignedRole).
    if (!session?.user?.email) {
      redirect('/auth/signin?callbackUrl=%2Fslot-booking');
    }
  }

  const normalized = session.user.email.toString().trim().toLowerCase();
  const assigned = await getAssignedRole(normalized);
  const isStudent = normalized.endsWith('@students.afda.co.za');

  // If user is not an AFDA email and they don't have an assigned role (including overrides),
  // require sign-in (prevents non-AFDA accounts from accessing staff surfaces).
  if (!isAfdaEmail(session.user.email) && !assigned) {
    redirect('/auth/signin?callbackUrl=%2Fslot-booking');
  }

  return (
    <SlotBookingAuthProvider session={session}>
      {children}
    </SlotBookingAuthProvider>
  );
}