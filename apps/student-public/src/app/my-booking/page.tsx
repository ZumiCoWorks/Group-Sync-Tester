'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type BookingDetails = {
  id: string;
  confirmation_number: string;
  student_name: string;
  student_email: string;
  status: string;
  booked_at: string;
  slot?: {
    id: string;
    start_time: string;
    end_time: string;
  } | null;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-core-backend-bmi3qmvu5-zcw-nav-eaze.vercel.app' : 'http://localhost:3001');

export default function MyBookingPage() {
  const router = useRouter();
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [error, setError] = useState('');
  const [copiedConfirmation, setCopiedConfirmation] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBooking(null);

    if (!confirmationNumber.trim() || !studentEmail.trim()) {
      setError('Please enter your confirmation number and email address.');
      return;
    }

    setSearching(true);

    try {
      const response = await fetch(`${backendUrl}/api/bookings/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation_number: confirmationNumber.trim().toUpperCase(),
          student_email: studentEmail.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message || 'Booking not found. Please check your confirmation number and email.');
        return;
      }

      setBooking(data.data);
    } catch (err) {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setSearching(false);
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.20),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_30%)]" />

      <div className="relative mx-auto max-w-2xl space-y-8">
        <div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Back
          </button>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              View your booking
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">Find your reservation</h1>
            <p className="text-slate-300">
              Enter your confirmation number and email address to see your booking details.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Confirmation number</label>
              <input
                type="text"
                value={confirmationNumber}
                onChange={(e) => setConfirmationNumber(e.target.value)}
                placeholder="ABC123XYZ"
                className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
              />
              <p className="mt-1 text-xs text-slate-400">You received this number in the confirmation email.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Email address</label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="you@example.edu"
                className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={searching}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {searching ? 'Searching…' : 'Find my booking'}
            </button>
          </form>
        </section>

        {booking && (
          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-4">Booking details</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Your name</p>
                  <p className="mt-2 text-lg font-semibold text-white">{booking.student_name}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
                  <p className="mt-2 text-lg font-semibold text-white break-all">{booking.student_email}</p>
                </div>
              </div>

              {booking.slot && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Slot</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {new Date(booking.slot.start_time).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="mt-1 text-slate-300">{formatTimeRange(booking.slot.start_time, booking.slot.end_time)}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                  <p className="mt-2 capitalize text-lg font-semibold text-cyan-200">{booking.status}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Booked at</p>
                  <p className="mt-2 text-sm text-slate-300">{formatDateTime(booking.booked_at)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Confirmation number</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="font-mono text-lg font-semibold text-white">{booking.confirmation_number}</p>
                  <button
                    onClick={handleCopyConfirmation}
                    className="rounded-lg bg-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/30"
                  >
                    {copiedConfirmation ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-300">
                If you need to cancel or modify your booking, please contact the organizer.
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
