'use client';

import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { SlotBookingAuthProvider } from './slot-booking-auth';

const MOCK_SESSION: Session = {
  user: {
    email: 'lecturer@afda.co.za',
    name: 'Demo Lecturer',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export function ClientSlotAuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return null;
  }

  return <SlotBookingAuthProvider session={session ?? MOCK_SESSION}>{children}</SlotBookingAuthProvider>;
}