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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(225,29,72,0.08),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_30%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-muted bg-white p-8 shadow-xl backdrop-blur-xl sm:p-10">
          <div className="inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-700">
            Booking confirmed
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-heading sm:text-5xl">
            Your slot is secured.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-body">
            We have recorded your booking for {batchTitle}. Keep the confirmation number below in
            case you need to check in later.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-muted bg-secondary p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-body">Confirmation number</p>
              <p className="mt-2 text-2xl font-semibold text-accent-creative">{confirmationNumber}</p>
            </div>
            <div className="rounded-2xl border border-muted bg-secondary p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-body">Booked for</p>
              <p className="mt-2 text-lg font-medium text-heading">{studentName || 'You'}</p>
              <p className="mt-1 text-sm text-body">{slotStart ? new Date(slotStart).toLocaleString() : 'Your selected slot'}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center rounded-2xl bg-accent-creative px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              Book another slot
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center rounded-2xl border border-muted bg-white px-5 py-3 text-sm font-semibold text-heading shadow-sm transition hover:bg-secondary"
            >
              Print confirmation
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-muted bg-secondary p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-body">Change or cancel</p>
            <p className="mt-2 text-sm leading-6 text-body">
              If you need to modify or cancel later, go to Manage booking and use your student number.
              If you want a different slot, cancel this booking first and then make a new one.
            </p>
            <button
              type="button"
              onClick={() => router.push('/my-booking')}
              className="mt-4 inline-flex items-center justify-center rounded-2xl border border-muted bg-white px-5 py-3 text-sm font-semibold text-heading shadow-sm transition hover:bg-secondary"
            >
              Manage booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
