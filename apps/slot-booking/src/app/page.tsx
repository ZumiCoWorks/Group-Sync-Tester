'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type DashboardBatch = {
  id: string;
  title: string;
  description?: string | null;
  status: 'draft' | 'pending_venue_approval' | 'published' | 'archived' | 'closed';
  booking_count: number;
  total_slots: number;
  slot_duration_minutes: number;
  per_slot_capacity: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  venue?: {
    id: string;
    name: string;
    capacity: number;
  } | null;
  created_by_user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
};

type DashboardResponse = {
  success: boolean;
  data?: DashboardBatch[];
  error?: {
    code: string;
    message: string;
  };
};

type AuthVerifyResponse = {
  success: boolean;
  data?: {
    tokenPayload?: {
      email?: string;
      role?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      [key: string]: unknown;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-api.vercel.app' : 'http://localhost:3001');
const AUTH_TOKEN_KEY = 'afda_slot_booking_token';

const statusStyles: Record<DashboardBatch['status'], string> = {
  draft: 'bg-slate-500/15 text-slate-200 ring-slate-400/20',
  pending_venue_approval: 'bg-amber-500/15 text-amber-200 ring-amber-400/20',
  published: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/20',
  archived: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
  closed: 'bg-rose-500/15 text-rose-200 ring-rose-400/20',
};

export default function Dashboard() {
  const router = useRouter();
  const [batches, setBatches] = useState<DashboardBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | DashboardBatch['status']>('all');
  const [authToken, setAuthToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [publishing, setPublishing] = useState<string | null>(null);
  const [profile, setProfile] = useState<
    | {
        email?: string;
        role?: string;
        name?: string;
      }
    | null
  >(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken) {
      void verifyToken(storedToken);
    } else {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authToken) {
      return;
    }

    const loadBatches = async () => {
      setLoading(true);
      setError('');
      try {
        const params = filter === 'all' ? '' : `?status=${encodeURIComponent(filter)}`;
        const response = await fetch(`${backendUrl}/api/batches${params}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as DashboardResponse;

        if (!response.ok || !payload.success) {
          setError(payload.error?.message || 'Unable to load batches.');
          return;
        }

        setBatches(payload.data || []);
      } catch (err) {
        setError('Unable to reach the backend.');
      } finally {
        setLoading(false);
      }
    };

    void loadBatches();
  }, [authToken, filter]);

  const verifyToken = async (token: string) => {
    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch(`${backendUrl}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = (await response.json()) as AuthVerifyResponse;

      if (!response.ok || !payload.success) {
        setAuthToken('');
        setProfile(null);
        setAuthError(payload.error?.message || 'Invalid or expired staff token.');
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        return;
      }

      const tokenPayload = payload.data?.tokenPayload || {};
      setAuthToken(token);
      setProfile({
        email: tokenPayload.email,
        role: tokenPayload.role,
        name: tokenPayload.name || [tokenPayload.given_name, tokenPayload.family_name].filter(Boolean).join(' '),
      });
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      setTokenInput('');
    } catch (err) {
      setAuthError('Unable to verify the token. Check your backend connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedToken = tokenInput.trim();

    if (!trimmedToken) {
      setAuthError('Paste a valid staff JWT token to continue.');
      return;
    }

    setAuthSubmitting(true);
    await verifyToken(trimmedToken);
    setAuthSubmitting(false);
  };

  const handleSignOut = () => {
    setAuthToken('');
    setProfile(null);
    setBatches([]);
    setError('');
    setFilter('all');
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  const handlePublish = async (batchId: string) => {
    setPublishing(batchId);
    try {
      const response = await fetch(`${backendUrl}/api/batches/${batchId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const payload = (await response.json()) as DashboardResponse;

      if (!response.ok) {
        setError(payload.error?.message || 'Unable to publish batch');
        return;
      }

      // Reload batches after successful publish
      const reloadResponse = await fetch(`${backendUrl}/api/batches`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const reloadPayload = (await reloadResponse.json()) as DashboardResponse;

      if (reloadResponse.ok && reloadPayload.success) {
        setBatches(reloadPayload.data || []);
      }
    } catch (err) {
      setError('Unable to publish batch. Check backend connection.');
    } finally {
      setPublishing(null);
    }
  };

  const metrics = useMemo(() => {
    const totalBatches = batches.length;
    const publishedBatches = batches.filter((batch) => batch.status === 'published').length;
    const draftBatches = batches.filter((batch) => batch.status === 'draft').length;
    const totalBookings = batches.reduce((sum, batch) => sum + (batch.booking_count || 0), 0);
    const capacity = batches.reduce(
      (sum, batch) => sum + (batch.total_slots || 0) * (batch.per_slot_capacity || 1),
      0
    );

    return {
      totalBatches,
      publishedBatches,
      draftBatches,
      totalBookings,
      capacity,
    };
  }, [batches]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-slate-200">
        <p className="text-lg">Checking staff access…</p>
      </div>
    );
  }

  if (!authToken) {
    return (
      <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_32%)]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
          <section className="w-full rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Staff access
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Sign in to manage batches and bookings.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Paste a valid JWT from your auth provider. We verify it with the backend and keep it
                locally so you can move between dashboard actions without repeating the step.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="staff-token" className="mb-2 block text-sm font-medium text-slate-200">
                  Staff token
                </label>
                <textarea
                  id="staff-token"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="Paste JWT here"
                  className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  For now this uses the backend verification endpoint. We can swap this for a full
                  provider login later without changing the dashboard flow.
                </p>
              </div>

              {authError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {authSubmitting ? 'Verifying token…' : 'Sign in'}
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_32%)]" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Staff dashboard
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Manage batches, slots, and bookings from one place.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Review draft and published batches, watch booking volume, and jump into the next
                action without leaving the dashboard.
              </p>
              <p className="text-sm text-slate-400">
                Signed in as <span className="font-medium text-slate-200">{profile?.email || 'staff user'}</span>
                {profile?.role ? <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">{profile.role}</span> : null}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push('/editor/new')}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                + New Batch
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Import participants
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
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Batches</h2>
                <p className="mt-2 text-sm text-slate-300">Filter and review the current batch queue.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {['all', 'draft', 'pending_venue_approval', 'published', 'archived', 'closed'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status as typeof filter)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      filter === status
                        ? 'bg-cyan-400 text-slate-950'
                        : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {status.split('_').join(' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
                  Loading batches…
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
                  {error}
                </div>
              ) : batches.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="text-slate-200">No batches match this filter.</p>
                  <p className="mt-2 text-sm text-slate-400">Create a batch to start booking slots.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => {
                    const occupancy =
                      batch.total_slots > 0
                        ? Math.round((batch.booking_count / (batch.total_slots * batch.per_slot_capacity)) * 100)
                        : 0;
                    return (
                      <article
                        key={batch.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/30 hover:bg-white/7"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-semibold text-white">{batch.title}</h3>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${statusStyles[batch.status]}`}
                              >
                                {batch.status.split('_').join(' ')}
                              </span>
                            </div>
                            <p className="max-w-3xl text-sm leading-6 text-slate-300">
                              {batch.description || 'No description added yet.'}
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                              <span>
                                Slots: <strong className="text-white">{batch.total_slots}</strong>
                              </span>
                              <span>
                                Bookings: <strong className="text-white">{batch.booking_count}</strong>
                              </span>
                              <span>
                                Duration: <strong className="text-white">{batch.slot_duration_minutes} mins</strong>
                              </span>
                              {batch.venue?.name && (
                                <span>
                                  Venue: <strong className="text-white">{batch.venue.name}</strong>
                                </span>
                              )}
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-cyan-400"
                                style={{ width: `${Math.min(100, occupancy)}%` }}
                              />
                            </div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              {occupancy}% capacity utilization
                            </p>
                          </div>

                          <div className="flex gap-3 lg:flex-col">
                            <button
                              type="button"
                              onClick={() => router.push(`/editor/${batch.id}`)}
                              className="rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push(`/editor/${batch.id}`)}
                              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                              Edit
                            </button>
                            {batch.status !== 'published' && (
                              <button
                                type="button"
                                onClick={() => void handlePublish(batch.id)}
                                disabled={publishing === batch.id}
                                className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:opacity-50"
                              >
                                {publishing === batch.id ? 'Publishing…' : 'Publish'}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold text-white">Quick actions</h2>
              <div className="mt-5 space-y-3">
                {[
                  'Create a batch draft',
                  'Publish selected batch',
                  'Import participants from XLSX',
                  'Export bookings to PDF/XLSX',
                ].map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => router.push(action === 'Create a batch draft' ? '/editor/new' : '/editor/new')}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    <span>{action}</span>
                    <span className="text-slate-400">→</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold text-white">System note</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                The dashboard is now wired to the backend batch list endpoint, so the next steps can
                reuse the same data model for create, edit, and publish workflows.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
