'use client';

import { DashboardShell } from './dashboard-shell';

export function LecturerBookingShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      tone="blue"
      eyebrow="AFDA Lecturer App"
      title="Lecturer Dashboard"
      description="Lecturer-owned slots, delegation controls, and calendar sync live here. Tutors work in their own lane."
      badgeLabel="Lecturer lane"
      navItems={[
        { href: '/slot-booking', label: 'Overview', description: 'Role launchpad' },
        { href: '/slot-booking/lecturer', label: 'Lecturer dashboard', description: 'Create and publish slots' },
      ]}
    >
      {children}
    </DashboardShell>
  );
}