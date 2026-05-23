'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const confirmationNumber = searchParams.get('confirmationNumber') || 'Pending';
  const batchTitle = searchParams.get('batchTitle') || 'Your batch';
  const slotStart = searchParams.get('slotStart') || '';
  const studentName = searchParams.get('studentName') || '';

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.20),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_30%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-10">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200">
            Booking confirmed
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Your slot is secured.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            We have recorded your booking for {batchTitle}. Keep the confirmation number below in
            case you need to check in later.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Confirmation number</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-300">{confirmationNumber}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Booked for</p>
              <p className="mt-2 text-lg font-medium text-white">{studentName || 'You'}</p>
              <p className="mt-1 text-sm text-slate-300">{slotStart ? new Date(slotStart).toLocaleString() : 'Your selected slot'}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Book another slot
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Print confirmation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
