"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { DashboardShell } from '@/slot-booking/components/dashboard-shell';

type RoleRequest = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: number;
};

export default function VenueOpsAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<'operations' | 'lecturer' | 'tutor' | 'student' | 'none'>('operations');
  const [switchMessage, setSwitchMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchRequests();
      return;
    }

    router.replace('/venue-ops/onboarding');
  }, [session, router]);

  async function fetchRequests() {
    setLoading(true);
    const res = await fetch('/api/roles/requests');
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRequests(data.requests ?? []);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    await fetch('/api/roles/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, approve: true }) });
    await fetchRequests();
  }

  async function handleReject(id: string) {
    await fetch('/api/roles/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, approve: false }) });
    await fetchRequests();
  }

  async function handleSwitchRole() {
    setSwitchMessage(null);
    const res = await fetch('/api/roles/admin-assign-self', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: activeRole }),
    });

    const data = await res.json();
    if (!res.ok) {
      setSwitchMessage(data?.error || 'Failed to switch role');
      return;
    }

    const next = data?.assigned || 'none';
    setSwitchMessage(`Role switched to: ${next}`);
  }

  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <DashboardShell
      tone="amber"
      eyebrow="AFDA Admin App"
      title="Role Requests"
      description="Approve role requests, switch your active test role, and keep ops testing separate from staff and student flows."
      badgeLabel="Admin lane"
      pendingCount={pending.length}
      navItems={[
        { href: '/venue-ops/admin', label: 'Role requests', description: 'Approve or reject' },
        { href: '/venue-ops', label: 'Ops console', description: 'Imports and audits' },
        { href: '/slot-booking', label: 'Booking hub', description: 'Role launchpad' },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-[#111522]/95 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-6">
          <h3 className="text-xl font-black text-white">Quick Role Switch</h3>
          <p className="mt-2 text-sm text-white/60">Signed in as: {session?.user?.email ?? 'unknown'}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <select
              className="min-w-[220px] rounded-2xl border border-white/10 bg-[#0d1320] px-4 py-3 text-sm text-white"
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as 'operations' | 'lecturer' | 'tutor' | 'student' | 'none')}
            >
              <option value="operations">operations</option>
              <option value="lecturer">lecturer</option>
              <option value="tutor">tutor</option>
              <option value="student">student</option>
              <option value="none">none (clear assignment)</option>
            </select>
            <Button onClick={handleSwitchRole} className="rounded-full px-5">Switch role</Button>
          </div>
          {switchMessage && <p className="mt-3 rounded-2xl bg-amber-500/15 px-4 py-3 text-sm text-amber-200">{switchMessage}</p>}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <MiniStat label="Pending" value={`${pending.length}`} />
            <MiniStat label="Approved" value={`${requests.filter((r) => r.status === 'approved').length}`} />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-[#111522]/95 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/45">Pending approvals</p>
              <h3 className="text-2xl font-black text-white">Ops requests</h3>
            </div>
          </div>

          {loading && <p className="mt-4 text-sm text-white/60">Loading…</p>}
          {!loading && pending.length === 0 && <p className="mt-4 text-sm text-white/60">No pending requests.</p>}
          <div className="mt-4 space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-white">{r.email}</div>
                    <div className="text-sm text-white/60">Requested: {r.role}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(r.id)} className="rounded-full">Approve</Button>
                    <Button variant="outline" onClick={() => handleReject(r.id)} className="rounded-full border-border">Reject</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
