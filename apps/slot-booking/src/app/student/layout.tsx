import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { isAfdaEmail } from '@/lib/afda-auth';
import { StudentBookingShell } from '@/slot-booking/components/student-booking-shell';

export const metadata: Metadata = {
  title: 'AFDA Student Booking',
  description: 'Student reservation flow.',
};

export default async function StudentSlotBookingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const requireAuth = process.env.NODE_ENV === 'production' && process.env.DISABLE_AUTH_REDIRECTS !== 'true';

  if (requireAuth && (!session?.user?.email || !isAfdaEmail(session.user.email))) {
    redirect('/auth/signin?callbackUrl=%2Fstudent');
  }

  return <StudentBookingShell>{children}</StudentBookingShell>;
}
