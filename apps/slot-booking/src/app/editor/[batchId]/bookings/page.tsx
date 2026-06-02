'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../utils/supabase';

type BookingRecord = {
  id: string;
  confirmation_number: string;
  student_name: string;
  student_email: string;
  student_id_external?: string | null;
  status: 'confirmed' | 'waitlisted' | 'cancelled' | 'attended';
  booked_at: string;
  slot?: {
    id: string;
    start_time: string;
    end_time: string;
    capacity: number;
    booking_count: number;
  } | null;
};

type BatchResponse = {
  success: boolean;
  data?: {
    id: string;
    title: string;
    status: string;
    booking_count?: number;
    total_slots?: number;
  };
  error?: { code: string; message: string };
};

type BookingsResponse = {
  success: boolean;
  data?: BookingRecord[];
  error?: { code: string; message: string };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://afda-api.vercel.app';

export default function BatchBookingsPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;

  const [checking, setChecking] = useState(true);
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [batch, setBatch] = useState<BatchResponse['data'] | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [error, setError] = useState('');
  const [updatingBookingId, setUpdatingBookingId] = useState('');
  const [updateError, setUpdateError] = useState('');

  const handleMarkAttended = async (bookingId: string) => {
    setUpdatingBookingId(bookingId);
    setUpdateError('');
    try {
      const response = await fetch(`${backendUrl}/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: 'attended' }),
      });
      if (!response.ok) {
        setUpdateError('Unable to mark booking attended.');
        return;
      }
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'attended' as const } : b))
      );
    } catch (err) {
      setUpdateError('Failed to update booking.');
    } finally {
      setUpdatingBookingId('');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setChecking(false);
        router.push('/');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/');
        return;
      }

      setAuthToken(session.access_token);
      setChecking(false);
    };

    void checkAuth();
  }, [router]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!authToken || !batchId) return;

      setLoading(true);
      setError('');

      try {
        const [batchResponse, bookingsResponse] = await Promise.all([
          fetch(`${backendUrl}/api/batches/internal/${batchId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch(`${backendUrl}/api/bookings?batchId=${encodeURIComponent(batchId)}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        const batchPayload = (await batchResponse.json()) as BatchResponse;
        const bookingsPayload = (await bookingsResponse.json()) as BookingsResponse;

        if (!batchResponse.ok || !batchPayload.success || !batchPayload.data) {
          setError(batchPayload.error?.message || 'Unable to load batch details.');
          return;
        }

        if (!bookingsResponse.ok || !bookingsPayload.success) {
          setError(bookingsPayload.error?.message || 'Unable to load booking roster.');
          return;
        }

        setBatch(batchPayload.data);
        setBookings(bookingsPayload.data || []);
      } catch (loadError) {
        setError('Unable to reach the backend.');
      } finally {
        setLoading(false);
      }
    };

    void loadBookings();
  }, [authToken, batchId]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter((booking) => booking.status === 'confirmed').length;
    const attended = bookings.filter((booking) => booking.status === 'attended').length;
    const cancelled = bookings.filter((booking) => booking.status === 'cancelled').length;

    return {
      total: bookings.length,
      confirmed,
      attended,
      cancelled,
    };
  }, [bookings]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-200">
        <p>Loading bookings roster…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(239,68,68,0.10),_transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(`/editor/${batchId}`)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Back to editor
          </button>
          <button
            type="button"
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_BATCH_LINK_BASE || 'https://student-public-zcw-nav-eaze.vercel.app'}/batch/${batchId}`, '_blank', 'noopener,noreferrer')}
            className="rounded-2xl bg-accent-business px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open student link
          </button>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-accent-creative/20 bg-accent-creative/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-creative">
              Lecturer roster
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              {batch?.title || 'Batch bookings'}
            </h1>
            <p className="text-sm text-slate-300">
              See exactly who booked each slot. This view uses the staff-authenticated bookings feed.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Bookings', value: stats.total },
              { label: 'Confirmed', value: stats.confirmed },
              { label: 'Attended', value: stats.attended },
              { label: 'Cancelled', value: stats.cancelled },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {updateError && (
            <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              {updateError}
            </div>
          )}
          {loading ? (
            <div className="text-sm text-slate-300">Loading booking records…</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
              {error}
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
              No one has booked this batch yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:hidden">
                {bookings.map((booking) => (
                  <article key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{booking.student_name}</p>
                        <p className="text-xs text-slate-400">{booking.student_email}</p>
                      </div>
                      <span className="rounded-full bg-accent-creative/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-creative">
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-slate-300">
                      <p>
                        <span className="text-slate-400">Slot: </span>
                        {booking.slot
                          ? `${new Date(booking.slot.start_time).toLocaleString()} - ${new Date(booking.slot.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                          : 'Slot unavailable'}
                      </p>
                      <p>
                        <span className="text-slate-400">Booked: </span>
                        {new Date(booking.booked_at).toLocaleString()}
                      </p>
                      <p className="font-mono text-slate-300">{booking.confirmation_number}</p>
                    </div>

                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => void handleMarkAttended(booking.id)}
                        disabled={updatingBookingId === booking.id}
                        className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {updatingBookingId === booking.id ? 'Marking…' : 'Mark attended'}
                      </button>
                    )}
                  </article>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Slot</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Booked at</th>
                      <th className="px-4 py-3 font-medium">Reference</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-slate-950/50 text-slate-100">
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-4 py-4">
                          <div className="font-medium text-white">{booking.student_name}</div>
                          <div className="text-xs text-slate-400">{booking.student_email}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {booking.slot
                            ? `${new Date(booking.slot.start_time).toLocaleString()} - ${new Date(booking.slot.end_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                            : 'Slot unavailable'}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-accent-creative/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-creative">
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {new Date(booking.booked_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 font-mono text-xs text-slate-300">
                          {booking.confirmation_number}
                        </td>
                        <td className="px-4 py-4">
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => void handleMarkAttended(booking.id)}
                              disabled={updatingBookingId === booking.id}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                              {updatingBookingId === booking.id ? 'Marking…' : 'Mark attended'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}