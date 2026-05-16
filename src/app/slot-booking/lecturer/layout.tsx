import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { isAfdaEmail } from '@/lib/afda-auth';
import { LecturerBookingShell } from '@/slot-booking/components/lecturer-booking-shell';

export const metadata: Metadata = {
  title: 'AFDA Lecturer Booking',
  description: 'Lecturer slot ownership, delegation, and calendar sync.',
};

export default async function LecturerSlotBookingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAfdaEmail(session.user.email)) {
    redirect('/auth/signin?callbackUrl=%2Fslot-booking%2Flecturer');
  }

  return <LecturerBookingShell>{children}</LecturerBookingShell>;
}