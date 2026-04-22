'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type SlotBookingRole = 'staff' | 'student';

type SlotBookingUser = {
  id: string;
  displayName: string;
  email: string;
  role: SlotBookingRole;
  mode: 'mock';
};

type SlotBookingAuthContextValue = {
  user: SlotBookingUser;
  mode: 'mock';
  canToggleRole: true;
  setRole: (role: SlotBookingRole) => void;
  setDisplayName: (displayName: string) => void;
};

const ROLE_DEFAULTS: Record<SlotBookingRole, { displayName: string; email: string }> = {
  staff: { displayName: 'Daisy Tutor', email: 'tutor@afda.local' },
  student: { displayName: 'Nandi Student', email: 'student@afda.local' },
};

const SlotBookingAuthContext = createContext<SlotBookingAuthContextValue | null>(null);

function buildUser(role: SlotBookingRole, displayName: string): SlotBookingUser {
  return {
    id: `${role}-${displayName.toLowerCase().replace(/\s+/g, '-')}`,
    displayName,
    email: ROLE_DEFAULTS[role].email,
    role,
    mode: 'mock',
  };
}

export function SlotBookingAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<SlotBookingRole>('staff');
  const [displayName, setDisplayNameState] = useState(ROLE_DEFAULTS.staff.displayName);

  useEffect(() => {
    const savedRole = window.localStorage.getItem('slot-booking_v1_role') as SlotBookingRole | null;
    if (savedRole === 'staff' || savedRole === 'student') {
      setRoleState(savedRole);
      setDisplayNameState(ROLE_DEFAULTS[savedRole].displayName);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('slot-booking_v1_role', role);
  }, [role]);

  const value = useMemo<SlotBookingAuthContextValue>(
    () => ({
      user: buildUser(role, displayName),
      mode: 'mock',
      canToggleRole: true,
      setRole: (nextRole: SlotBookingRole) => {
        setRoleState(nextRole);
        setDisplayNameState(ROLE_DEFAULTS[nextRole].displayName);
      },
      setDisplayName: (nextDisplayName: string) => {
        setDisplayNameState(nextDisplayName);
      },
    }),
    [displayName, role],
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