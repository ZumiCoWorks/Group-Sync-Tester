'use client';

import { SlotBookingLecturerPage } from '@/slot-booking/pages/slot-booking-lecturer';
import { ClientSlotAuthWrapper } from '@/slot-booking/auth/client-slot-auth-wrapper';

export default function SlotBookingLecturerRoute() {
  return (
    <ClientSlotAuthWrapper>
      <SlotBookingLecturerPage />
    </ClientSlotAuthWrapper>
  );
}