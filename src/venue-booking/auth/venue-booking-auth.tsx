'use client';

import { createContext, useContext, useMemo } from 'react';

type VenueBookingUser = {
  id: string;
  displayName: string;
  email: string;
  role: 'operations';
  mode: 'mock';
};

type VenueBookingAuthContextValue = {
  user: VenueBookingUser;
  mode: 'mock';
  canToggleRole: false;
};

const VenueBookingAuthContext = createContext<VenueBookingAuthContextValue | null>(null);

export function VenueBookingAuthProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<VenueBookingAuthContextValue>(
    () => ({
      user: {
        id: 'operations-nomsa-operations',
        displayName: 'Nomsa Operations',
        email: 'ops@afda.local',
        role: 'operations',
        mode: 'mock',
      },
      mode: 'mock',
      canToggleRole: false,
    }),
    [],
  );

  return <VenueBookingAuthContext.Provider value={value}>{children}</VenueBookingAuthContext.Provider>;
}

export function useVenueBookingAuth() {
  const context = useContext(VenueBookingAuthContext);
  if (!context) {
    throw new Error('useVenueBookingAuth must be used within VenueBookingAuthProvider');
  }

  return context;
}