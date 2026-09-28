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
  date_range_start?: string | null;
  date_range_end?: string | null;
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
  draft: 'bg-slate-100 text-slate-800 ring-slate-300',
  pending_venue_approval: 'bg-amber-50 text-amber-900 ring-amber-300',
  published: 'bg-emerald-50 text-emerald-800 ring-emerald-300',
  archived: 'bg-slate-100 text-slate-700 ring-slate-300',
  closed: 'bg-rose-50 text-rose-800 ring-rose-300',
};

function getTodayInJohannesburg() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function isBatchExpired(batch: DashboardBatch) {
  return Boolean(batch.date_range_end && batch.date_range_end.slice(0, 10) < getTodayInJohannesburg());
}

function getSafeReturnPath() {
  if (typeof window === 'undefined') return null;
  const candidate = new URLSearchParams(window.location.search).get('returnTo');
  if (!candidate || !candidate.startsWith('/editor/') || candidate.startsWith('//')) return null;
  return candidate;
}

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
    <article className="rounded-2xl border border-muted bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-heading">{batch.title}</h3>
          <p className="mt-2 text-sm text-body">
            Bookings: <span className="font-semibold text-heading">{booked}</span> /{' '}
            <span className="font-semibold text-heading">{seatsTotal}</span> seats ({percent}%) • Slots:{' '}
            <span className="font-medium text-heading">{batch.total_slots}</span>
          </p>
          {batch.date_range_start && batch.date_range_end && (
            <p className="mt-1 text-sm font-medium text-slate-700">
              Scheduled {batch.date_range_start.slice(0, 10)} to {batch.date_range_end.slice(0, 10)}
            </p>
          )}
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
            className="min-h-11 rounded-sm bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onOpenAttendance(batch.id)}
            className="min-h-11 rounded-sm border-2 border-slate-900 bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Attendance
          </button>
          <button
            type="button"
            onClick={() => window.open(bookingLink, '_blank', 'noopener,noreferrer')}
            disabled={!canShare}
            className={`min-h-11 rounded-sm px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
              canShare
                ? 'bg-slate-950 text-white hover:bg-red-700'
                : 'cursor-not-allowed border-2 border-slate-300 bg-slate-100 text-slate-600'
            }`}
          >
            Open booking page
          </button>
          <button
            type="button"
            onClick={() => onCopyBookingLink(batch.id)}
            disabled={!canShare}
            className={`min-h-11 rounded-sm border-2 px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              canShare
                ? 'border-red-700 bg-white text-red-800 hover:bg-red-50 focus-visible:outline-red-700'
                : 'cursor-not-allowed border-slate-300 bg-slate-100 text-slate-600 focus-visible:outline-slate-500'
            }`}
          >
            {copiedBatchId === batch.id ? 'Link copied' : 'Copy link'}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-body opacity-80">
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
  const [returnPath, setReturnPath] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const safeReturnPath = getSafeReturnPath();
      setReturnPath(safeReturnPath);

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
        if (safeReturnPath) {
          router.replace(safeReturnPath);
          return;
        }
      }
      setAuthLoading(false);
    };
    void checkSession();
  }, [router]);

  useEffect(() => {
    if (!authToken) return;

    const loadBatches = async () => {
      setLoading(true);
      setBackendError('');
      try {
        const response = await fetch(`${backendUrl}/api/batches`, {
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
  }, [authToken]);

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
        const safeReturnPath = getSafeReturnPath();
        if (safeReturnPath) router.replace(safeReturnPath);
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
    () => batches.filter((batch) => !isBatchExpired(batch) && batch.status !== 'closed' && batch.status !== 'archived' && (filter === 'all' || batch.status === filter)),
    [batches, filter]
  );
  const archivedBatches = useMemo(
    () => batches.filter((batch) => isBatchExpired(batch) || batch.status === 'closed' || batch.status === 'archived'),
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
              <p className="text-sm text-body">
                {returnPath
                  ? 'Sign in once to continue the setup you started in Continuum.'
                  : 'Enter your credentials to access the slot dashboard.'}
              </p>
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
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
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
                className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200 dark:hover:bg-rose-400/15"
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
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
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
                        {batch.date_range_start && batch.date_range_end && (
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            Scheduled {batch.date_range_start.slice(0, 10)} to {batch.date_range_end.slice(0, 10)}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ring-1 ${statusStyles[batch.status]}`}>
                            {batch.status}
                          </span>
                          {isBatchExpired(batch) && (
                            <span className="inline-block rounded-full bg-amber-50 px-3 py-0.5 text-xs font-bold text-amber-900 ring-1 ring-amber-300">
                              Expired {batch.date_range_end?.slice(0, 10)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => router.push(`/editor/${batch.id}/bookings`)}
                          className="min-h-11 rounded-sm border-2 border-slate-900 bg-white px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
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
