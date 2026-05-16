import type { Metadata } from 'next';
import { OpsBookingShell } from '@/slot-booking/components/ops-booking-shell';

export const metadata: Metadata = {
  title: 'AFDA Venue Ops',
  description: 'Venue management, approvals, and operational overrides (Venue Ops).',
};

export default function VenueOpsLayout({ children }: { children: React.ReactNode }) {
  return <OpsBookingShell>{children}</OpsBookingShell>;
}
