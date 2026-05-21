'use client';

import { DashboardShell } from './dashboard-shell';

export function LecturerBookingShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      tone="blue"
      eyebrow="AFDA"
      title="Lecturer"
      badgeLabel="Lecturer lane"
      navItems={[
        { href: '/', label: 'Home' },
        { href: '/lecturer', label: 'Slots' },
      ]}
    >
      {children}
    </DashboardShell>
  );
}