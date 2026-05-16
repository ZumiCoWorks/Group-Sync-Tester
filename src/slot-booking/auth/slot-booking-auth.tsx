'use client';

import { createContext, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { Session } from 'next-auth';
import { resolveDisplayName } from '@/lib/afda-auth';
import { resolveSurfaceRole } from '@/worksuite/authority';

export type SlotBookingRole = 'operations' | 'lecturer' | 'tutor' | 'student';

type SlotBookingUser = {
  id: string;
  displayName: string;
  email: string;
  role: SlotBookingRole;
  mode: 'connected';
};

type SlotBookingAuthContextValue = {
  user: SlotBookingUser;
  mode: 'connected';
  canToggleRole: false;
  role: SlotBookingRole;
  signOutUrl: string;
};

const SlotBookingAuthContext = createContext<SlotBookingAuthContextValue | null>(null);

function resolveRole(pathname: string): SlotBookingRole {
  return resolveSurfaceRole(pathname);
}

export function SlotBookingAuthProvider({ children, session }: { children: React.ReactNode; session: Session }) {
  const pathname = usePathname();
  const role = resolveRole(pathname);
  const email = session.user?.email?.trim().toLowerCase() || '';
  const displayName = resolveDisplayName(session.user?.name, email);

  const value = useMemo<SlotBookingAuthContextValue>(
    () => ({
      user: {
        id: email || 'afda-user',
        displayName,
        email,
        role,
        mode: 'connected',
      },
      mode: 'connected',
      canToggleRole: false,
      role,
      signOutUrl: `/api/auth/signout?callbackUrl=${encodeURIComponent(pathname)}`,
    }),
    [displayName, email, pathname, role],
  );

  return <SlotBookingAuthContext.Provider value={value}>{children}</SlotBookingAuthContext.Provider>;
}

export function useSlotBookingAuth() {
  const context = useContext(SlotBookingAuthContext);
  if (!context) {
    throw new Error('useSlotBookingAuth must be used within SlotBookingAuthProvider');
  }

  return context;
}