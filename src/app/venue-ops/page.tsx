import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { getAssignedRole } from '@/lib/role-store';
import { SlotBookingOpsPage } from '@/slot-booking/pages/slot-booking-ops';
import { DashboardShell } from '@/slot-booking/components/dashboard-shell';

export default async function VenueOpsRoute() {
  const session = (await getServerSession(authOptions as any)) as any;
  const email = session?.user?.email?.toString().trim().toLowerCase() ?? '';
  const assigned = email ? await getAssignedRole(email) : null;

  if (!email || assigned !== 'operations') {
    redirect('/venue-ops/onboarding');
  }

  return (
    <DashboardShell
      tone="amber"
      eyebrow="AFDA Operations App"
      title="Operations Console"
      description="Manage venue imports, lockout controls, and audit visibility for all slot-booking lanes."
      badgeLabel="Ops lane"
      navItems={[
        { href: '/venue-ops', label: 'Ops console', description: 'Imports and audits' },
        { href: '/venue-ops/admin', label: 'Admin', description: 'Role approvals' },
        { href: '/slot-booking', label: 'Booking hub', description: 'Role launchpad' },
      ]}
    >
      <SlotBookingOpsPage />
    </DashboardShell>
  );
}
