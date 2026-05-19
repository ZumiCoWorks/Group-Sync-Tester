import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { isAfdaEmail } from '@/lib/afda-auth';
import { TutorBookingShell } from '@/slot-booking/components/tutor-booking-shell';

export const metadata: Metadata = {
  title: 'AFDA Tutor Booking',
  description: 'Tutor slot creation flow.',
};

export default async function TutorSlotBookingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAfdaEmail(session.user.email)) {
    redirect('/auth/signin?callbackUrl=%2Fslot-booking%2Ftutor');
  }

  return <TutorBookingShell>{children}</TutorBookingShell>;
}
