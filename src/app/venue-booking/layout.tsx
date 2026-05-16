import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { isAfdaEmail } from '@/lib/afda-auth';
import { VenueBookingAuthProvider } from '@/venue-booking/auth/venue-booking-auth';
import { VenueBookingFrame } from '@/venue-booking/components/venue-booking-frame';

export const metadata: Metadata = {
  title: 'AFDA Venue Booking',
  description: 'Operations-only venue import and occupancy timeline.',
};

export default async function VenueBookingLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !isAfdaEmail(session.user.email)) {
    redirect('/auth/signin?callbackUrl=%2Fvenue-booking');
  }

  return (
    <VenueBookingAuthProvider session={session}>
      <VenueBookingFrame>{children}</VenueBookingFrame>
    </VenueBookingAuthProvider>
  );
}