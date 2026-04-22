'use client';

import { useMemo } from 'react';
import { useWorksuiteStore } from '@/worksuite/store/use-worksuite-store';

export function useVenueBookingStore() {
  const shared = useWorksuiteStore();

  return useMemo(
    () => ({
      venues: shared.venues,
      summary: {
        venueCount: shared.summary.venueCount,
        openSlotCount: shared.summary.openSlotCount,
        bookingCount: shared.summary.bookingCount,
      },
      lastImport: shared.lastImport,
      lastMapping: shared.lastMapping,
      loadSpreadsheet: shared.loadSpreadsheet,
      importVenues: shared.importVenues,
      resetToSeed: shared.resetToSeed,
    }),
    [shared],
  );
}