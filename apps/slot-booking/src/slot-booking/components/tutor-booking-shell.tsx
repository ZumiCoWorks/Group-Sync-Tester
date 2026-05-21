'use client';

import { DashboardShell } from './dashboard-shell';

export function TutorBookingShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      tone="orange"
      eyebrow="AFDA Tutor App"
      title="Tutor Booking"
      description="Tutor-only slot creation and publishing. Lecturer ownership is handled separately."
      badgeLabel="Tutor lane"
      navItems={[
        { href: '/', label: 'Overview', description: 'Role launchpad' },
        { href: '/tutor', label: 'Tutor booking', description: 'Draft and publish batches' },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
