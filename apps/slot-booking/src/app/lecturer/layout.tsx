import type { Metadata } from 'next';
import { LecturerBookingShell } from '@/slot-booking/components/lecturer-booking-shell';

export const metadata: Metadata = {
  title: 'AFDA Lecturer Booking',
  description: 'Lecturer slot ownership, delegation, and calendar sync.',
};

export default function LecturerSlotBookingLayout({ children }: { children: React.ReactNode }) {
  return <LecturerBookingShell>{children}</LecturerBookingShell>;
}