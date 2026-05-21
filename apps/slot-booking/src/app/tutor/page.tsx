'use client';

import { SlotBookingTutorPage } from '@/slot-booking/pages/slot-booking-tutor';
import { ClientSlotAuthWrapper } from '@/slot-booking/auth/client-slot-auth-wrapper';

export default function SlotBookingTutorRoute() {
  return (
    <ClientSlotAuthWrapper>
      <SlotBookingTutorPage />
    </ClientSlotAuthWrapper>
  );
}