import type { Metadata } from 'next';
import { VenueBookingAuthProvider } from '@/venue-booking/auth/venue-booking-auth';
import { VenueBookingFrame } from '@/venue-booking/components/venue-booking-frame';

export const metadata: Metadata = {
  title: 'AFDA Venue Booking',
  description: 'Operations-only venue import and occupancy timeline.',
};

export default function VenueBookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <VenueBookingAuthProvider>
      <VenueBookingFrame>{children}</VenueBookingFrame>
    </VenueBookingAuthProvider>
  );
}