'use client';

import { DashboardShell } from './dashboard-shell';

export function StudentBookingShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      tone="emerald"
      eyebrow="AFDA Student App"
      title="Student Booking"
      description="A mobile-first booking lane for students. Fast claiming, minimal chrome, and no staff controls visible here."
      badgeLabel="Student lane"
      navItems={[
        { href: '/slot-booking', label: 'Overview', description: 'Role launchpad' },
        { href: '/slot-booking/student', label: 'Student booking', description: 'Claim a published slot' },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
