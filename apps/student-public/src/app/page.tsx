'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-core-backend-bmi3qmvu5-zcw-nav-eaze.vercel.app' : 'http://localhost:3001');

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

  const normalizedBatchId = batchId.trim().toUpperCase();

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Student booking portal
            </div>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                Find your batch, pick a slot, and secure it in one pass.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Enter the batch code from your lecturer or follow the direct link. The portal will
                show the available dates and let you claim a slot without extra steps.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                'Batch lookup by code',
                'Live slot availability',
                'Fast confirmation flow',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-sm font-medium text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
            <div className="mb-8 space-y-2">
              <h2 className="text-2xl font-semibold text-white">Enter batch code</h2>
              <p className="text-sm leading-6 text-slate-300">
                Example: <span className="font-medium text-cyan-300">ABC123</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="batchId" className="mb-2 block text-sm font-medium text-slate-200">
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
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg text-white placeholder:text-slate-500 shadow-sm outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  disabled={loading}
                />
                <p id="batch-help" className="mt-2 text-xs leading-5 text-slate-400">
                  Batch codes are usually short uppercase strings. Copy the code exactly as provided.
                </p>
              </div>

              {error && (
                <div id="batch-error" role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  <div className="flex items-start justify-between gap-3">
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="shrink-0 rounded-full border border-rose-300/20 bg-white/10 px-3 py-1 text-xs font-semibold text-rose-50 transition hover:bg-white/15"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {loading ? 'Finding your batch...' : 'Find My Batch'}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              Already have a direct link? Open it and the portal will take you straight to the
              booking page.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
