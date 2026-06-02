'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type BookingDetails = {
  id: string;
  batch_id: string;
  confirmation_number: string;
  student_name: string;
  student_email: string;
  student_id_external?: string | null;
  status: string;
  booked_at: string;
  slot?: {
    id: string;
    start_time: string;
    end_time: string;
  } | null;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-core-backend.vercel.app' : 'http://localhost:3001');

export default function MyBookingPage() {
  const router = useRouter();
  const [studentIdExternal, setStudentIdExternal] = useState('');
  const [searching, setSearching] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedConfirmation, setCopiedConfirmation] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBooking(null);

    if (!studentIdExternal.trim()) {
      setError('Please enter your student number to find your booking.');
      return;
    }

    setSearching(true);

    try {
      const response = await fetch(`${backendUrl}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id_external: studentIdExternal.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message || 'Booking not found. Please check your student number and try again.');
        return;
      }

      setBooking(data.data);
    } catch (err) {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;

    setError('');
    setSuccess('');
    setCancelling(true);

    try {
      const response = await fetch(`${backendUrl}/api/bookings/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          student_id_external: studentIdExternal.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message || 'Unable to cancel booking.');
        return;
      }

      setBooking((current) => (current ? { ...current, status: 'cancelled' } : current));
      setSuccess('Your booking has been cancelled. Redirecting you now...');

      const batchResponse = await fetch(`${backendUrl}/api/batches/${booking.batch_id}`);
      const redirectTarget = batchResponse.ok ? `/batch/${booking.batch_id}` : '/';

      window.setTimeout(() => {
        router.push(redirectTarget);
      }, 1200);
    } catch (cancelError) {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString([], { dateStyle: 'long', timeStyle: 'short' });
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  };

  const handleCopyConfirmation = async () => {
    if (!booking) return;
    try {
      await navigator.clipboard.writeText(booking.confirmation_number);
      setCopiedConfirmation(true);
      setTimeout(() => setCopiedConfirmation(false), 2000);
    } catch (err) {
      // Fallback: just alert the user
      alert('Unable to copy. Please copy manually: ' + booking.confirmation_number);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(225,29,72,0.08),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_30%)]" />

      <div className="relative mx-auto max-w-2xl space-y-8">
        <div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-2xl border border-muted bg-white px-4 py-2 text-sm font-medium text-heading shadow-sm transition hover:bg-secondary"
          >
            Back
          </button>
        </div>

        <section className="rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-accent-creative/20 bg-accent-creative/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-creative">
              View your booking
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-heading">Find your reservation</h1>
            <p className="text-body">
              Enter your student number to find and manage your booking.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-heading">Student number <span className="text-amber-700">(required)</span></label>
              <input
                type="text"
                value={studentIdExternal}
                onChange={(e) => setStudentIdExternal(e.target.value)}
                placeholder="e.g., STU-001"
                required
                className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading placeholder:text-slate-400 outline-none transition focus:border-accent-creative/60 focus:ring-4 focus:ring-accent-creative/10"
              />
              <p className="mt-1 text-xs text-body">Use the student number you entered when booking.</p>
            </div>

            <div className="rounded-2xl border border-muted bg-secondary p-4 text-sm leading-6 text-body shadow-sm">
              We now look up bookings by student number only. If you booked earlier with a different student number, use the same number you entered at booking time.
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={searching}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-accent-creative px-4 py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {searching ? 'Searching…' : 'Find my booking'}
            </button>
          </form>
        </section>

        {booking && (
          <section className="rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="space-y-6">
              <div>
                <h2 className="mb-4 text-2xl font-semibold text-heading">Booking details</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-body">Your name</p>
                  <p className="mt-2 text-lg font-semibold text-heading">{booking.student_name}</p>
                </div>
                <div className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-body">Email</p>
                  <p className="mt-2 break-all text-lg font-semibold text-heading">{booking.student_email}</p>
                </div>
              </div>

              {booking.slot && (
                <div className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-body">Slot</p>
                  <p className="mt-2 text-lg font-semibold text-heading">
                    {new Date(booking.slot.start_time).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="mt-1 text-body">{formatTimeRange(booking.slot.start_time, booking.slot.end_time)}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-body">Status</p>
                  <p className="mt-2 text-lg font-semibold capitalize text-accent-business">{booking.status}</p>
                </div>
                <div className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-body">Booked at</p>
                  <p className="mt-2 text-sm text-body">{formatDateTime(booking.booked_at)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-body">Confirmation number</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-mono text-lg font-semibold text-heading">{booking.confirmation_number}</p>
                  <button
                    onClick={handleCopyConfirmation}
                    className="rounded-lg bg-accent-business/10 px-3 py-1 text-xs font-semibold text-accent-business transition hover:bg-accent-business/20"
                  >
                    {copiedConfirmation ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-body">Manage booking</p>
                <p className="mt-2 text-sm text-body">
                  Need to change your plans? You can cancel this booking now and then book a new slot.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => router.push(`/batch/${booking.batch_id}`)}
                    className="inline-flex items-center justify-center rounded-2xl border border-muted bg-white px-5 py-3 text-sm font-semibold text-heading shadow-sm transition hover:bg-secondary"
                  >
                    Book a different slot
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCancelBooking()}
                    disabled={cancelling || booking.status === 'cancelled'}
                    className="inline-flex items-center justify-center rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {cancelling ? 'Cancelling…' : booking.status === 'cancelled' ? 'Cancelled' : 'Cancel booking'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
