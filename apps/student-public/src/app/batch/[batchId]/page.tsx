'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-core-backend.vercel.app' : 'http://localhost:3001');

const formatSlotDate = (value: string) =>
  new Date(value).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const formatSlotTime = (value: string) =>
  new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

const formatSlotWindow = (slot: Slot) =>
  `${formatSlotDate(slot.start_time)} • ${formatSlotTime(slot.start_time)} - ${formatSlotTime(slot.end_time)}`;

export default function BatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;
  const detailsRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [batch, setBatch] = useState<Batch | null>(null);
  const [isClosed, setIsClosed] = useState(false);
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

        // If the batch has been closed or archived, mark it and skip slots/booking.
        if (batchData.data?.status === 'closed' || batchData.data?.status === 'archived') {
          setIsClosed(true);
          setSlots([]);
          return;
        }

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

  const openSlots = useMemo(
    // Show slots that still have space (booking_count < capacity)
    () => slots.filter((slot) => (slot.booking_count || 0) < (slot.capacity || 1)),
    [slots]
  );

  const slotsByDay = useMemo(() => {
    return openSlots.reduce<Record<string, Slot[]>>((acc, slot) => {
      const key = new Date(slot.start_time).toDateString();
      acc[key] = acc[key] || [];
      acc[key].push(slot);
      return acc;
    }, {} as Record<string, Slot[]>);
  }, [openSlots]);

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId);

    window.setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nameInputRef.current?.focus();
    }, 0);
  };

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
        if (data?.error?.code === 'STUDENT_ALREADY_BOOKED') {
          setError('You already have a booking in this batch. Use Manage booking to cancel it first, then book a new slot.');
        } else if (data?.error?.code === 'SLOT_FULL') {
          setError('That slot is already full. Please choose another open slot.');
        } else {
          setError(data?.error?.message || 'Unable to create booking.');
        }
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
      <div className="flex min-h-screen items-center justify-center px-4 text-body">
        <p className="text-lg">Loading your batch…</p>
      </div>
    );
  }

  if (error && !batch) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-3xl font-semibold text-heading">Booking unavailable</h1>
          <p className="text-body">{error || 'This batch is no longer available.'}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-2xl bg-accent-creative px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (isClosed && batch) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-3xl font-semibold text-heading">This batch is closed</h1>
          <p className="text-body">Bookings for "{batch.title}" are no longer available — the batch has finished or been archived.</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="mt-4 rounded-2xl border border-muted bg-white px-5 py-3 text-sm font-semibold text-heading transition hover:bg-secondary"
            >
              Back to Home
            </button>
            <button
              type="button"
              onClick={() => router.push(`/batch/${batchId}/student-roster`)}
              className="mt-4 rounded-2xl bg-accent-creative px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
            >
              View slot availability
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(225,29,72,0.08),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_30%)]" />

      <div className="relative mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-2xl border border-muted bg-white px-4 py-2 text-sm font-medium text-heading shadow-sm transition hover:bg-secondary"
          >
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/batch/${batchId}/student-roster`)}
              className="rounded-2xl border border-muted bg-white px-4 py-2 text-sm font-medium text-heading shadow-sm transition hover:bg-secondary"
            >
              View availability
            </button>
            <p className="rounded-full border border-muted bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-body shadow-sm">
              Batch {batchId}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-accent-creative/20 bg-accent-creative/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-creative">
                Step 1 of 2
              </div>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-heading">Choose your slot, then confirm.</h1>
                {batch?.description ? (
                  <p className="mt-3 text-body">{batch.description}</p>
                ) : (
                  <p className="mt-3 text-body">
                    Pick one open slot. We’ll hold it for you once you submit the form.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-body">Slots available</p>
                  <p className="mt-2 text-2xl font-semibold text-heading">{openSlots.length}</p>
                </div>
                <div className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-body">Current status</p>
                  <p className="mt-2 text-2xl font-semibold capitalize text-heading">
                    {batch?.status.split('_').join(' ')}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-muted bg-secondary p-4 text-sm leading-6 text-body">
                <p className="font-medium text-heading">How it works</p>
                <ol className="mt-2 space-y-1 pl-5 list-decimal">
                  <li>Select a time that is still open.</li>
                  <li>Enter your details and confirm the booking.</li>
                </ol>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-body">Calendar view — pick a slot</h3>
                {openSlots.length === 0 ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-700">
                    All slots are currently full. If you already have a booking, use the booking management page to cancel it.
                  </div>
                ) : (
                  <div className="overflow-x-auto lg:overflow-x-visible">
                    <div className="flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(slotsByDay)
                        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                        .map(([dayKey, daySlots]) => (
                          <div key={dayKey} className="min-w-[240px] flex-shrink-0 md:min-w-unset">
                            <div className="mb-2">
                              <p className="text-sm font-semibold text-white">{formatSlotDate(daySlots[0]?.start_time || dayKey)}</p>
                              <p className="text-xs text-slate-400">
                                {daySlots.length} open slots
                              </p>
                            </div>

                            <div className="space-y-2">
                              {daySlots
                                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                .map((s) => {
                                  const isSelected = selectedSlotId === s.id;
                                  return (
                                    <button
                                      key={s.id}
                                      onClick={() => handleSlotSelect(s.id)}
                                      className={`w-full rounded-2xl border px-3 py-2 text-left transition ${isSelected ? 'border-accent-creative/50 bg-accent-creative/10' : 'border-muted bg-white hover:bg-secondary'}`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm font-medium text-heading">{formatSlotTime(s.start_time)} - {formatSlotTime(s.end_time)}</p>
                                        </div>
                                        <div className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
                                          Open
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {slotsError && (
              <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
                <div className="flex items-start justify-between gap-3">
                  <p>{slotsError}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="shrink-0 rounded-full border border-amber-200/20 bg-white px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </section>

          <section ref={detailsRef} className="rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8 lg:sticky lg:top-8 lg:self-start">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <div className="inline-flex rounded-full border border-accent-business/20 bg-accent-business/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-business">
                  Step 2 of 2
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-heading">Enter your details</h2>
                <p className="mt-2 text-sm text-body">Select a slot and this form becomes the next step automatically.</p>
              </div>

              {selectedSlot ? (
                <div className="rounded-2xl border border-muted bg-secondary p-4 text-sm text-body">
                  Selected slot: <span className="font-medium text-heading">{formatSlotWindow(selectedSlot)}</span>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700">
                  Pick a slot on the left to continue.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Full name</label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={studentName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading placeholder:text-slate-400 outline-none transition focus:border-accent-creative/60 focus:ring-4 focus:ring-accent-creative/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Email address</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentEmail(e.target.value)}
                    placeholder="ada@example.edu"
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading placeholder:text-slate-400 outline-none transition focus:border-accent-creative/60 focus:ring-4 focus:ring-accent-creative/10"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-heading">
                  Student ID or reference <span className="text-body">(optional)</span>
                </label>
                <input
                  type="text"
                  value={studentIdExternal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStudentIdExternal(e.target.value)}
                  placeholder="STU-001"
                  className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading placeholder:text-slate-400 outline-none transition focus:border-accent-creative/60 focus:ring-4 focus:ring-accent-creative/10"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedSlotId || openSlots.length === 0}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-accent-creative px-4 py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? 'Submitting booking…' : 'Reserve this slot'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
