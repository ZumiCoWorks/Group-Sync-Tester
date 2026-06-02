'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-core-backend.vercel.app' : 'http://localhost:3001');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!batchId.trim()) {
      setError('Please enter a batch ID');
      setLoading(false);
      return;
    }

    try {
      const normalizedBatchId = batchId.trim().toUpperCase();
      const response = await fetch(`${backendUrl}/api/batches/${normalizedBatchId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        setError('Batch not found. Please check the ID and try again.');
        setLoading(false);
        return;
      }

      router.push(`/batch/${normalizedBatchId}`);
    } catch (err) {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-[rgba(225,29,72,0.10)] blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-[rgba(37,99,235,0.08)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-muted bg-white/90 px-4 py-2 text-sm text-body shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-accent-creative" />
              Student booking portal
            </div>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-heading sm:text-6xl">
                Book a slot or manage an existing booking in one place.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-body">
                If you are booking for the first time, enter your batch code. If you already booked,
                go straight to your booking details to cancel or update your plans.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: 'New booking',
                  text: 'Use the batch code from your lecturer to pick an available slot.',
                },
                {
                  title: 'Manage booking',
                  text: 'Use your confirmation number, email, or student number to find a booking.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-muted bg-white p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold text-heading">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-body">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push('/my-booking')}
                className="inline-flex items-center justify-center rounded-2xl border border-muted bg-white px-5 py-3 text-sm font-semibold text-heading shadow-sm transition hover:bg-secondary"
              >
                Manage existing booking
              </button>
              <a
                href="#batch-code"
                className="inline-flex items-center justify-center rounded-2xl bg-accent-creative px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Book a slot
              </a>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="rounded-2xl border border-muted bg-secondary p-4 text-sm leading-6 text-body">
              <p className="font-medium text-heading">What happens next</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Enter your batch code to find the correct event.</li>
                <li>Pick an open slot and submit your details.</li>
                <li>If you already booked, use the manage-booking page instead.</li>
              </ol>
            </div>

            <div id="batch-code" className="mb-8 space-y-2 pt-2">
              <h2 className="text-2xl font-semibold text-heading">Enter batch code</h2>
              <p className="text-sm leading-6 text-body">
                Example: <span className="font-medium text-accent-business">ABC123</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="batchId" className="mb-2 block text-sm font-medium text-heading">
                  Batch Code
                </label>
                <input
                  id="batchId"
                  type="text"
                  placeholder="e.g., ABC123"
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value.toUpperCase())}
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={64}
                  required
                  aria-invalid={Boolean(error)}
                  aria-describedby="batch-help batch-error"
                  className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-lg text-heading placeholder:text-slate-400 shadow-sm outline-none transition focus:border-accent-creative/60 focus:ring-4 focus:ring-accent-creative/10"
                  disabled={loading}
                />
                <p id="batch-help" className="mt-2 text-xs leading-5 text-body">
                  Batch codes are usually short uppercase strings. Copy the code exactly as provided.
                </p>
              </div>

              {error && (
                <div id="batch-error" role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700">
                  <div className="flex items-start justify-between gap-3">
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="shrink-0 rounded-full border border-rose-300/20 bg-white px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-accent-creative px-4 py-3.5 text-center text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? 'Finding your batch...' : 'Find My Batch'}
              </button>
            </form>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push('/my-booking')}
                className="rounded-2xl border border-muted bg-white px-4 py-3 text-sm font-semibold text-heading shadow-sm transition hover:bg-secondary"
              >
                I already booked
              </button>
              <button
                type="button"
                onClick={() => setError('')}
                className="rounded-2xl border border-muted bg-white px-4 py-3 text-sm font-semibold text-body shadow-sm transition hover:bg-secondary"
              >
                Clear batch code
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
