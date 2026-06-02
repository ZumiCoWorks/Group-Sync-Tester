'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';

type DashboardBatch = {
  id: string;
  title: string;
  description?: string | null;
  status: 'draft' | 'pending_venue_approval' | 'published' | 'archived' | 'closed';
  booking_count: number;
  total_slots: number;
  slot_duration_minutes: number;
  per_slot_capacity: number;
  batch_capacity?: number | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  venue?: { id: string; name: string; capacity: number } | null;
};

type DashboardResponse = {
  success: boolean;
  data?: DashboardBatch[];
  error?: { code: string; message: string };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://afda-api.vercel.app';
const studentBookingBase = process.env.NEXT_PUBLIC_BATCH_LINK_BASE || 'https://student-public-zcw-nav-eaze.vercel.app';
const AUTH_TOKEN_KEY = 'afda_slot_booking_token';

type DashboardSection = 'active' | 'archived';

const statusStyles: Record<DashboardBatch['status'], string> = {
  draft: 'bg-slate-500/15 text-slate-200 ring-slate-400/20',
  pending_venue_approval: 'bg-amber-500/15 text-amber-200 ring-amber-400/20',
  published: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/20',
  archived: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
  closed: 'bg-rose-500/15 text-rose-200 ring-rose-400/20',
};

function BatchCard({
  batch,
  copiedBatchId,
  onCopyBookingLink,
  onEdit,
  onOpenAttendance,
}: {
  batch: DashboardBatch;
  copiedBatchId: string;
  onCopyBookingLink: (batchId: string) => void;
  onEdit: (batchId: string) => void;
  onOpenAttendance: (batchId: string) => void;
}) {
  const canShare = batch.status === 'published';
  const bookingLink = `${studentBookingBase}/batch/${batch.id}`;
  const seatsTotal =
    batch.batch_capacity ?? Number(batch.total_slots || 0) * Number(batch.per_slot_capacity || 1);
  const booked = Number(batch.booking_count || 0);
  const percent = seatsTotal > 0 ? Math.round((booked / seatsTotal) * 100) : 0;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{batch.title}</h3>
          <p className="mt-2 text-sm text-slate-300">
            Bookings: <span className="font-semibold text-white">{booked}</span> /{' '}
            <span className="font-semibold text-white">{seatsTotal}</span> seats ({percent}%) • Slots:{' '}
            <span className="font-medium text-white">{batch.total_slots}</span>
          </p>
          <span
            className={`inline-block mt-2 rounded-full px-3 py-0.5 text-xs font-medium ring-1 ${statusStyles[batch.status]}`}
          >
            {batch.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(batch.id)}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onOpenAttendance(batch.id)}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
          >
            Attendance
          </button>
          <button
            type="button"
            onClick={() => window.open(bookingLink, '_blank', 'noopener,noreferrer')}
            disabled={!canShare}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Open booking page
          </button>
          <button
            type="button"
            onClick={() => onCopyBookingLink(batch.id)}
            disabled={!canShare}
            className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copiedBatchId === batch.id ? 'Link copied' : 'Copy link'}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        {canShare
          ? `Shareable booking URL: ${bookingLink}`
          : 'Publish this batch before sharing the student link.'}
      </p>
    </article>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [batches, setBatches] = useState<DashboardBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState('');
  const [filter, setFilter] = useState<'all' | DashboardBatch['status']>('all');
  const [section, setSection] = useState<DashboardSection>('active');
  const [copiedBatchId, setCopiedBatchId] = useState('');

  const [authToken, setAuthToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        setAuthLoading(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setAuthToken(session.access_token);
        setUserEmail(session.user.email || null);
        window.localStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
      }
      setAuthLoading(false);
    };
    void checkSession();
  }, []);

  useEffect(() => {
    if (!authToken) return;

    const loadBatches = async () => {
      setLoading(true);
      setBackendError('');
      try {
        const params = filter === 'all' ? '' : `?status=${encodeURIComponent(filter)}`;
        const response = await fetch(`${backendUrl}/api/batches${params}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const payload = (await response.json()) as DashboardResponse;

        if (!response.ok || !payload.success) {
          setBackendError(payload.error?.message || 'Unable to load batches.');
          return;
        }
        setBatches(payload.data || []);
      } catch (err) {
        setBackendError('Unable to reach the backend.');
      } finally {
        setLoading(false);
      }
    };
    void loadBatches();
  }, [authToken, filter]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError('');

    try {
      if (!supabase) {
        setAuthError('Authentication is not configured.');
        return;
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setAuthError(signInError.message);
        return;
      }

      if (data?.session) {
        setAuthToken(data.session.access_token);
        setUserEmail(data.session.user.email || null);
        window.localStorage.setItem(AUTH_TOKEN_KEY, data.session.access_token);
      }
    } catch (err) {
      setAuthError('An unexpected authentication error occurred.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setAuthToken('');
    setUserEmail(null);
    setBatches([]);
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const metrics = useMemo(() => {
    return {
      totalBatches: batches.length,
      publishedBatches: batches.filter((b) => b.status === 'published').length,
      draftBatches: batches.filter((b) => b.status === 'draft').length,
      totalBookings: batches.reduce((sum, b) => sum + (b.booking_count || 0), 0),
    };
  }, [batches]);

  const activeBatches = useMemo(
    () => batches.filter((batch) => batch.status !== 'closed' && batch.status !== 'archived'),
    [batches]
  );
  const archivedBatches = useMemo(
    () => batches.filter((batch) => batch.status === 'closed' || batch.status === 'archived'),
    [batches]
  );

  const copyBookingLink = async (batchId: string) => {
    try {
      await navigator.clipboard.writeText(`${studentBookingBase}/batch/${batchId}`);
      setCopiedBatchId(batchId);
    } catch (err) {
      setBackendError('Unable to copy the booking link.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-body">
        <p className="text-lg">Checking your session…</p>
      </div>
    );
  }

  if (!authToken) {
    return (
      <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.15),_transparent_35%)]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
          <section className="w-full rounded-2xl border border-muted bg-white p-6 shadow-sm backdrop-blur-xl sm:p-8">
            <div className="space-y-2 text-center">
              <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
                AFDA Collaborative Works
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-heading">Staff Login</h1>
              <p className="text-sm text-body">Enter your credentials to access the slot dashboard.</p>
            </div>

            <form onSubmit={handleSignIn} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-body">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-muted bg-white px-4 py-3 text-sm text-heading outline-none transition focus:border-accent-creative/60"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-body">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-muted bg-white px-4 py-3 text-sm text-heading outline-none transition focus:border-accent-creative/60"
                  required
                />
              </div>

              {authError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-200">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:bg-slate-700"
              >
                {authSubmitting ? 'Authenticating session…' : 'Sign In'}
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-muted bg-white p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
                Staff dashboard
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-heading sm:text-5xl">
                Manage batches, slots, and bookings.
              </h1>
              <p className="text-sm text-body">
                Logged in as: <span className="font-medium text-heading">{userEmail}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push('/editor/new')}
                className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                + New Batch
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/15"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total batches', value: metrics.totalBatches },
              { label: 'Published', value: metrics.publishedBatches },
              { label: 'Drafts', value: metrics.draftBatches },
              { label: 'Bookings', value: metrics.totalBookings },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-muted bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-body">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-heading">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-muted bg-white p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSection('active')}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  section === 'active'
                    ? 'bg-red-600 text-white'
                    : 'border border-muted bg-white text-body'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setSection('archived')}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  section === 'archived'
                    ? 'bg-red-600 text-white'
                    : 'border border-muted bg-white text-body'
                }`}
              >
                Archived
              </button>
            </div>

            {section === 'active' && (
              <div className="flex flex-wrap gap-2">
                {['all', 'draft', 'published'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status as typeof filter)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      filter === status
                        ? 'bg-red-600 text-white'
                        : 'border border-muted bg-white text-body'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="text-sm text-body">Loading your batches...</div>
            ) : backendError ? (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
                {backendError}
              </div>
            ) : section === 'active' ? (
              activeBatches.length === 0 ? (
                <div className="rounded-2xl border border-muted bg-white p-8 text-center shadow-sm">
                  <p className="text-heading">No active batches yet. Create one to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBatches.map((batch) => (
                    <BatchCard
                      key={batch.id}
                      batch={batch}
                      copiedBatchId={copiedBatchId}
                      onCopyBookingLink={copyBookingLink}
                      onEdit={(batchId) => router.push(`/editor/${batchId}`)}
                      onOpenAttendance={(batchId) => router.push(`/editor/${batchId}/bookings`)}
                    />
                  ))}
                </div>
              )
            ) : archivedBatches.length === 0 ? (
              <div className="rounded-2xl border border-muted bg-white p-8 text-center shadow-sm">
                <p className="text-heading">No archived batches.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {archivedBatches.map((batch) => (
                  <article key={batch.id} className="rounded-2xl border border-muted bg-white p-5 opacity-90 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-heading">{batch.title}</h3>
                        <p className="mt-2 text-sm text-body">
                          Slots: <span className="font-medium text-heading">{batch.total_slots}</span> • Bookings:{' '}
                          <span className="font-semibold text-heading">{batch.booking_count}</span>
                        </p>
                        <span
                          className={`inline-block mt-2 rounded-full px-3 py-0.5 text-xs font-medium ring-1 ${statusStyles[batch.status]}`}
                        >
                          {batch.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/editor/${batch.id}/bookings`)}
                          className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
                        >
                          View roster
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
