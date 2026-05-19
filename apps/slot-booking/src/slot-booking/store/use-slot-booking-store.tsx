'use client';

import { useMemo } from 'react';
import { useWorksuiteStore } from '@/worksuite/store/use-worksuite-store';

export function useSlotBookingStore(currentUser?: { email: string } | null) {
  const shared = useWorksuiteStore(currentUser as never);

  return useMemo(
    () => ({
      venues: shared.venues,
      slotBatches: shared.slotBatches,
      slots: shared.slots,
      bookings: shared.bookings,
      delegations: shared.delegations,
      audits: shared.audits,
      summary: shared.summary,
      lastImport: shared.lastImport,
      lastMapping: shared.lastMapping,
      loadSpreadsheet: shared.loadSpreadsheet,
      importVenues: shared.importVenues,
      grantDelegation: shared.grantDelegation,
      revokeDelegation: shared.revokeDelegation,
      createSlots: shared.createSlots,
      publishBatch: shared.publishBatch,
      bookSlot: shared.bookSlot,
      resetToSeed: shared.resetToSeed,
    }),
    [shared],
  );
}