'use client';

import { useMemo } from 'react';
import { useWorksuiteStore } from '@/worksuite/store/use-worksuite-store';

export function useSlotBookingStore(currentUser?: { email: string } | null) {
  const shared = useWorksuiteStore(currentUser as never);

  return useMemo(
    () => ({
      venues: shared.venues,
      slots: shared.slots,
      bookings: shared.bookings,
      audits: shared.audits,
      summary: shared.summary,
      createSlots: shared.createSlots,
      bookSlot: shared.bookSlot,
      resetToSeed: shared.resetToSeed,
    }),
    [shared],
  );
}