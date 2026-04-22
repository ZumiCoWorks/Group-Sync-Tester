import type { Metadata } from 'next';
import { SlotBookingAuthProvider } from '@/slot-booking/auth/slot-booking-auth';
import { SlotBookingFrame } from '@/slot-booking/components/slot-booking-frame';

export const metadata: Metadata = {
  title: 'AFDA Student Booking Slots',
  description: 'Lecturer slot creation and student claim flows.',
};

export default function SlotBookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SlotBookingAuthProvider>
      <SlotBookingFrame>{children}</SlotBookingFrame>
    </SlotBookingAuthProvider>
  );
}