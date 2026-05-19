'use client';

import { DashboardShell } from './dashboard-shell';

export function OpsBookingShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      tone="amber"
      eyebrow="AFDA Ops App"
      title="Operations Dashboard"
      description="Venue management, approvals, lockouts, and overrides stay separate from lecturer and tutor tools."
      badgeLabel="Operations lane"
      navItems={[
        { href: '/slot-booking', label: 'Overview', description: 'Role launchpad' },
        { href: '/venue-ops', label: 'Ops dashboard', description: 'Approvals and venues' },
      ]}
    >
      {children}
    </DashboardShell>
  );
}