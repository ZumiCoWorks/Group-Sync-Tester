'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Batch = {
  id: string;
  title: string;
  description?: string;
  status: string;
};

type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booking_count: number;
};

type BookingResponse = {
  id: string;
  confirmation_number: string;
  slot_id: string;
  batch_id: string;
  student_name: string;
  student_email: string;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-api.vercel.app' : 'http://localhost:3001');

export default function BatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slotsError, setSlotsError] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentIdExternal, setStudentIdExternal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBatch = async () => {
      setLoading(true);
      setError('');
      setSlotsError('');
      try {
        const [batchRes, slotsRes] = await Promise.all([
          fetch(`${backendUrl}/api/batches/${batchId}`),
          fetch(`${backendUrl}/api/batches/${batchId}/slots`),
        ]);

        if (!batchRes.ok) {
          setError('Batch not found');
          return;
        }

        const batchData = await batchRes.json();
        setBatch(batchData.data);

        if (slotsRes.ok) {
          const slotsData = await slotsRes.json();
          const availableSlots = (slotsData.data || []) as Slot[];
          setSlots(availableSlots);
          const firstAvailable = availableSlots.find((slot) => slot.booking_count < slot.capacity);
          if (firstAvailable) {
            setSelectedSlotId(firstAvailable.id);
          }
        } else {
          setSlotsError('We could not load the slot list right now. You can still retry.');
        }
      } catch (err) {
        setError('Connection error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      fetchBatch();
    }
  }, [batchId]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId),
    [slots, selectedSlotId]
  );

  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.booking_count < slot.capacity),
    [slots]
  );

  const retryLoad = () => {
    setLoading(true);
    setBatch(null);
    setSlots([]);
    setSelectedSlotId('');
    setError('');
    setSlotsError('');
    void Promise.resolve();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedSlotId) {
      setError('Please select a slot.');
      return;
    }

    if (!studentName.trim() || !studentEmail.trim()) {
      setError('Please provide your name and email address.');
      return;
    }

    if (!studentEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${backendUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotId: selectedSlotId,
          studentName: studentName.trim(),
          studentEmail: studentEmail.trim().toLowerCase(),
          studentIdExternal: studentIdExternal.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error?.message || 'Unable to create booking.');
        return;
      }

      router.push(
        `/batch/${batchId}/confirm?confirmationNumber=${encodeURIComponent(
          data.data.confirmation_number || data.data.confirmationNumber || 'Pending'
        )}&batchTitle=${encodeURIComponent(batch?.title || 'Your batch')}&slotStart=${encodeURIComponent(
          selectedSlot?.start_time || ''
        )}&studentName=${encodeURIComponent(studentName.trim())}`
      );
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-slate-200">
        <p className="text-lg">Loading your batch…</p>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-3xl font-semibold text-white">Oops</h1>
          <p className="text-slate-300">{error || 'This batch is no longer available.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.20),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_30%)]" />

      <div className="relative mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Back
          </button>
          <p className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
            Batch {batchId}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Booking details
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-white">{batch?.title}</h1>
                {batch?.description && <p className="mt-3 text-slate-300">{batch.description}</p>}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Available slots</p>
                <p className="mt-2 text-2xl font-semibold text-white">{availableSlots.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Batch status</p>
                <p className="mt-2 text-2xl font-semibold text-white capitalize">
                  {batch?.status.split('_').join(' ')}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3 text-sm leading-6 text-slate-300">
              <p>
                Select one of the open slots and enter your details. Once submitted, you’ll be taken
                straight to a confirmation screen.
              </p>
              <p>
                If the slot fills up while you’re booking, we’ll show a clear message so you can pick
                another time.
              </p>
            </div>

            {slotsError && (
              <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <div className="flex items-start justify-between gap-3">
                  <p>{slotsError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="shrink-0 rounded-full border border-amber-200/20 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-50 transition hover:bg-white/15"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Choose a slot</h2>
                <p className="mt-2 text-sm text-slate-300">Only available slots are shown below.</p>
              </div>

              <div className="space-y-3">
                {slots.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                    No slots available for this batch.
                  </div>
                ) : (
                  slots.map((slot) => {
                    const available = slot.booking_count < slot.capacity;
                    const isSelected = slot.id === selectedSlotId;
                    return (
                      <label
                        key={slot.id}
                          className={`flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                          isSelected
                            ? 'border-cyan-400/50 bg-cyan-400/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        } ${!available ? 'opacity-50' : ''}`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="slot"
                              value={slot.id}
                              checked={isSelected}
                              onChange={() => setSelectedSlotId(slot.id)}
                              disabled={!available}
                              className="h-4 w-4 border-white/20 bg-transparent text-cyan-400 focus:ring-cyan-400"
                            />
                            <p className="font-medium text-white">
                              {new Date(slot.start_time).toLocaleString()}
                            </p>
                          </div>
                          <p className="pl-7 text-sm text-slate-300">
                            {slot.booking_count} of {slot.capacity} claimed
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            available
                              ? 'bg-emerald-400/10 text-emerald-200'
                              : 'bg-slate-500/20 text-slate-300'
                          }`}
                        >
                          {available ? 'Open' : 'Full'}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Full name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Email address</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentEmail(e.target.value)}
                    placeholder="ada@example.edu"
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Student ID or reference <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={studentIdExternal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentIdExternal(e.target.value)}
                  placeholder="STU-001"
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />
              </div>

              {selectedSlot && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 sm:sticky sm:bottom-4">
                  Selected slot: <span className="font-medium text-white">{new Date(selectedSlot.start_time).toLocaleString()}</span>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedSlotId || slots.length === 0}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {submitting ? 'Submitting booking…' : 'Confirm booking'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
