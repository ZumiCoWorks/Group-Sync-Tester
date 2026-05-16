import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { isAfdaEmail } from '@/lib/afda-auth';
import { OpsBookingShell } from '@/slot-booking/components/ops-booking-shell';

export const metadata: Metadata = {
  title: 'AFDA Ops Booking',
  description: 'Venue management, approvals, and operational overrides.',
};

export default async function OpsSlotBookingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAfdaEmail(session.user.email)) {
    redirect('/auth/signin?callbackUrl=%2Fslot-booking%2Fops');
  }

  return <OpsBookingShell>{children}</OpsBookingShell>;
}