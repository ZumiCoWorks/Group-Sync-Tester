'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { venueSupabase } from '../utils/supabase';

type Venue = {
  id: string;
  name: string;
  address?: string | null;
  capacity: number;
  facilities?: string[] | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  ops_owner_id?: string | null;
};

type VenueRequest = {
  id: string;
  batch_id: string;
  status: 'pending' | 'approved' | 'declined';
  request_notes?: string | null;
  decline_reason?: string | null;
  created_at: string;
  batch?: { id: string; title: string; status: string; venue_id?: string | null } | null;
  venue?: { id: string; name: string; capacity: number } | null;
  requested_by_user?: { id: string; email: string; first_name: string; last_name: string; role: string } | null;
};

type ApiResponse<T> = { success: boolean; data?: T; error?: { code: string; message: string } };

type UserRole = 'student' | 'staff' | 'lecturer' | 'ops' | 'admin' | 'integrator';
type AuthUser = Session['user'];

type AuthState = 'checking' | 'signed-out' | 'signed-in';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://afda-api.vercel.app';

function getRoleFromSession(session: Session | null): UserRole {
  const role = session?.user.app_metadata?.role || session?.user.user_metadata?.role || 'staff';
  return ['student', 'staff', 'lecturer', 'ops', 'admin', 'integrator'].includes(role) ? (role as UserRole) : 'staff';
}

export default function VenueBookingDashboard() {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [authToken, setAuthToken] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authRole, setAuthRole] = useState<UserRole>('staff');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [requests, setRequests] = useState<VenueRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [requestVenueId, setRequestVenueId] = useState('');
  const [requestBatchId, setRequestBatchId] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueCapacity, setVenueCapacity] = useState('');
  const [creatingVenue, setCreatingVenue] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [resolvingId, setResolvingId] = useState('');

  const canManageVenues = authRole === 'ops' || authRole === 'admin';
  const canResolveRequests = authRole === 'ops' || authRole === 'admin';
  const canRequestVenues = authRole !== 'student';

  const loadData = async (token: string) => {
    setLoading(true);
    setLoadError('');
    try {
      const [venueResponse, requestResponse] = await Promise.all([
        fetch(`${backendUrl}/api/venues`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/venues/requests`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const venuePayload = (await venueResponse.json()) as ApiResponse<Venue[]>;
      const requestPayload = (await requestResponse.json()) as ApiResponse<VenueRequest[]>;

      if (!venueResponse.ok || !venuePayload.success) {
        throw new Error(venuePayload.error?.message || 'Unable to load venues');
      }

      if (!requestResponse.ok || !requestPayload.success) {
        throw new Error(requestPayload.error?.message || 'Unable to load venue requests');
      }

      setVenues(venuePayload.data || []);
      setRequests(requestPayload.data || []);
      if (!requestVenueId && venuePayload.data?.length) {
        setRequestVenueId(venuePayload.data[0].id);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load venue workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!venueSupabase) {
      setAuthError('Missing Supabase environment variables.');
      setAuthState('signed-out');
      return;
    }

    let mounted = true;

    venueSupabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (!session) {
        setAuthState('signed-out');
        return;
      }

      const token = session.access_token;
      setAuthUser(session.user);
      setAuthRole(getRoleFromSession(session));
      setAuthToken(token);
      setAuthState('signed-in');
      await loadData(token);
    });

    const { data: subscription } = venueSupabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session) {
        setAuthUser(null);
        setAuthToken('');
        setAuthRole('staff');
        setAuthState('signed-out');
        setVenues([]);
        setRequests([]);
        return;
      }

      const token = session.access_token;
      setAuthUser(session.user);
      setAuthRole(getRoleFromSession(session));
      setAuthToken(token);
      setAuthState('signed-in');
      await loadData(token);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!venueSupabase) {
      setAuthError('Supabase is not configured for this app.');
      return;
    }

    setSubmitting(true);
    setAuthError('');
    try {
      const email = authEmail.trim();
      const password = authPassword.trim();
      if (!email || !password) {
        setAuthError('Enter your email and password to sign in.');
        return;
      }

      const { data, error } = await venueSupabase.auth.signInWithPassword({ email, password });
      if (error || !data.session) {
        setAuthError(error?.message || 'Unable to sign in');
        return;
      }

      setAuthUser(data.session.user);
      setAuthRole(getRoleFromSession(data.session));
      setAuthToken(data.session.access_token);
      setAuthState('signed-in');
      await loadData(data.session.access_token);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to verify access');
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    if (!venueSupabase) return;
    await venueSupabase.auth.signOut();
    setAuthUser(null);
    setAuthToken('');
    setAuthRole('staff');
    setAuthState('signed-out');
    setVenues([]);
    setRequests([]);
  };

  const createVenue = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreatingVenue(true);
    setLoadError('');
    try {
      const response = await fetch(`${backendUrl}/api/venues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: venueName, capacity: Number(venueCapacity) }),
      });
      const payload = (await response.json()) as ApiResponse<Venue>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Unable to create venue');
      }
      setVenueName('');
      setVenueCapacity('');
      await loadData(authToken);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to create venue');
    } finally {
      setCreatingVenue(false);
    }
  };

  const createRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequesting(true);
    setLoadError('');
    try {
      const response = await fetch(`${backendUrl}/api/venues/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ batchId: requestBatchId, venueId: requestVenueId, requestNotes }),
      });
      const payload = (await response.json()) as ApiResponse<VenueRequest>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Unable to create request');
      }
      setRequestBatchId('');
      setRequestNotes('');
      await loadData(authToken);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to create request');
    } finally {
      setRequesting(false);
    }
  };

  const resolveRequest = async (requestId: string, action: 'approve' | 'decline') => {
    setResolvingId(requestId);
    setLoadError('');
    try {
      const response = await fetch(`${backendUrl}/api/venues/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ declineReason: action === 'decline' ? 'Conflict or capacity issue' : undefined }),
      });
      const payload = (await response.json()) as ApiResponse<unknown>;
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || `Unable to ${action} request`);
      }
      await loadData(authToken);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : `Unable to ${action} request`);
    } finally {
      setResolvingId('');
    }
  };

  const metrics = useMemo(
    () => ({
      venueCount: venues.length,
      pendingRequests: requests.filter((request) => request.status === 'pending').length,
      approvedRequests: requests.filter((request) => request.status === 'approved').length,
      declinedRequests: requests.filter((request) => request.status === 'declined').length,
    }),
    [venues, requests],
  );

  if (authState === 'checking') {
    return <div className="flex min-h-screen items-center justify-center px-4 text-slate-200">Checking venue access…</div>;
  }

  if (authState === 'signed-out') {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-12">
        <section className="w-full rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Venue planning workspace</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Venue Booking</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Ops manages venues and conflicts. Staff and lecturers submit requests here for the term plan.
          </p>
          <form onSubmit={submitLogin} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" placeholder="name@school.edu" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} type="password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" placeholder="••••••••" />
              </div>
            </div>
            {authError ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{authError}</div> : null}
            <button disabled={submitting} className="w-full rounded-2xl bg-orange-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">{submitting ? 'Signing in…' : 'Sign in with Supabase'}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Venue Booking</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Allocate venues without spreadsheet noise.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Staff and lecturers submit needs. Ops resolves conflicts, confirms allocations, and keeps the term plan moving.
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
              Signed in as {authUser?.email || 'unknown user'} · role {authRole}
            </p>
          </div>
          <button type="button" onClick={() => void signOut()} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
            Sign out
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Venues', value: metrics.venueCount },
            { label: 'Pending', value: metrics.pendingRequests },
            { label: 'Approved', value: metrics.approvedRequests },
            { label: 'Declined', value: metrics.declinedRequests },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
        {canManageVenues ? (
          <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Create venue</h2>
            <form onSubmit={createVenue} className="mt-5 space-y-4">
              <input value={venueName} onChange={(event) => setVenueName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Venue name" />
              <input value={venueCapacity} onChange={(event) => setVenueCapacity(event.target.value)} type="number" min="1" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Capacity" />
              <button disabled={creatingVenue} className="rounded-2xl bg-orange-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">{creatingVenue ? 'Saving…' : 'Save venue'}</button>
            </form>
            <div className="mt-6 space-y-3">
              {venues.map((venue) => (
                <article key={venue.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{venue.name}</h3>
                      <p className="text-sm text-slate-400">Capacity {venue.capacity}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">Active</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Term planning</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              This workspace is where batches request venues and Ops clears clashes before the slot-booking app consumes the final allocation.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Use the request form to hand off planning needs to Ops.
            </div>
          </section>
        )}

        {canRequestVenues ? (
          <section className="rounded-3xl border border-white/10 bg-[var(--surface)] p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold">Request venue</h2>
            <p className="mt-2 text-sm text-slate-300">Use this to replace spreadsheet comments with a single request action.</p>
            <form onSubmit={createRequest} className="mt-5 space-y-4">
              <input value={requestBatchId} onChange={(event) => setRequestBatchId(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Batch ID" />
              <select value={requestVenueId} onChange={(event) => setRequestVenueId(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
                <option value="">Select venue</option>
                {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
              </select>
              <textarea value={requestNotes} onChange={(event) => setRequestNotes(event.target.value)} className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Notes about timing, size, or constraints" />
              <button disabled={requesting} className="rounded-2xl bg-orange-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-60">{requesting ? 'Sending…' : 'Request venue'}</button>
            </form>

            <div className="mt-6 space-y-3">
              {requests.map((request) => (
                <article key={request.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{request.batch?.title || request.batch_id}</h3>
                      <p className="text-sm text-slate-400">{request.venue?.name || 'Venue pending'}</p>
                      {request.request_notes ? <p className="mt-2 text-sm text-slate-300">{request.request_notes}</p> : null}
                      {request.decline_reason ? <p className="mt-2 text-sm text-rose-200">{request.decline_reason}</p> : null}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${request.status === 'approved' ? 'bg-emerald-400/10 text-emerald-200' : request.status === 'declined' ? 'bg-rose-400/10 text-rose-200' : 'bg-amber-400/10 text-amber-200'}`}>{request.status}</span>
                  </div>
                  {canResolveRequests && request.status === 'pending' ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void resolveRequest(request.id, 'approve')} disabled={resolvingId === request.id} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">Approve</button>
                      <button type="button" onClick={() => void resolveRequest(request.id, 'decline')} disabled={resolvingId === request.id} className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200">Decline</button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {loadError ? <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{loadError}</div> : null}
      {loading ? <p className="mt-4 text-sm text-slate-300">Refreshing venue workspace…</p> : null}
    </main>
  );
}
