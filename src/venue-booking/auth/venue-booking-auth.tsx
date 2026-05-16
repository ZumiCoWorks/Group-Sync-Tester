'use client';

import { createContext, useContext, useMemo } from 'react';
import type { Session } from 'next-auth';
import { resolveDisplayName } from '@/lib/afda-auth';

type VenueBookingUser = {
  id: string;
  displayName: string;
  email: string;
  role: 'operations';
  mode: 'connected';
};

type VenueBookingAuthContextValue = {
  user: VenueBookingUser;
  mode: 'connected';
  canToggleRole: false;
  signOutUrl: string;
};

const VenueBookingAuthContext = createContext<VenueBookingAuthContextValue | null>(null);

export function VenueBookingAuthProvider({ children, session }: { children: React.ReactNode; session: Session }) {
  const email = session.user?.email?.trim().toLowerCase() || '';
  const displayName = resolveDisplayName(session.user?.name, email);

  const value = useMemo<VenueBookingAuthContextValue>(
    () => ({
      user: {
        id: email || 'afda-user',
        displayName,
        email,
        role: 'operations',
        mode: 'connected',
      },
      mode: 'connected',
      canToggleRole: false,
      signOutUrl: `/api/auth/signout?callbackUrl=${encodeURIComponent('/venue-booking')}`,
    }),
    [displayName, email],
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