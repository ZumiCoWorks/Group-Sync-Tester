'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type SlotInfo = {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booking_count: number;
};

type RosterData = {
  batch: { id: string; title: string; status: string; booking_count?: number; total_slots?: number };
  slots: SlotInfo[];
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-core-backend.vercel.app' : 'http://localhost:3001');

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

const formatTimeRange = (startTime: string, endTime: string) =>
  `${new Date(startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

export default function StudentRosterPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batchTitle, setBatchTitle] = useState('');
  const [batchStatus, setBatchStatus] = useState('');
  const [slots, setSlots] = useState<SlotInfo[]>([]);

  useEffect(() => {
    const loadRoster = async () => {
      setLoading(true);
      setError('');

      if (!batchId) {
        setError('Batch not found.');
        setLoading(false);
        return;
      }

      try {
        const [batchRes, slotsRes] = await Promise.all([
          fetch(`${backendUrl}/api/batches/${batchId}`),
          fetch(`${backendUrl}/api/batches/${batchId}/slots`),
        ]);

        if (!batchRes.ok || !slotsRes.ok) {
          setError('Unable to load batch data.');
          return;
        }

        const batchData = await batchRes.json();
        const slotsData = await slotsRes.json();

        setBatchTitle(batchData.data?.title || 'Batch');
        setBatchStatus(batchData.data?.status || '');
        setSlots(slotsData.data || []);
      } catch (loadError) {
        setError('Unable to reach the server.');
      } finally {
        setLoading(false);
      }
    };

    void loadRoster();
  }, [batchId]);

  const slotsByDay = useMemo(() => {
    return slots.reduce<Record<string, SlotInfo[]>>((acc, slot) => {
      const key = new Date(slot.start_time).toDateString();
      acc[key] = acc[key] || [];
      acc[key].push(slot);
      return acc;
    }, {} as Record<string, SlotInfo[]>);
  }, [slots]);

  const stats = useMemo(
    () => ({
      total: slots.reduce((sum, slot) => sum + slot.booking_count, 0),
      openSeats: slots.reduce((sum, slot) => sum + Math.max(slot.capacity - slot.booking_count, 0), 0),
      openSlots: slots.filter((slot) => slot.booking_count < slot.capacity).length,
    }),
    [slots]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-body">
        <p className="text-lg">Loading roster…</p>
      </div>
    );
  }

  if (error && !batchTitle) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-3xl font-semibold text-heading">Roster unavailable</h1>
          <p className="text-body">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 rounded-2xl bg-accent-creative px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(225,29,72,0.08),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push(`/batch/${batchId}`)}
            className="rounded-2xl border border-muted bg-white px-4 py-2 text-sm font-medium text-heading shadow-sm transition hover:bg-secondary"
          >
            Back to booking
          </button>
        </div>

        <section className="rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-accent-business/20 bg-accent-business/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-business">
              Availability overview
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-heading">{batchTitle}</h1>
            {batchStatus ? (
              <p className="text-sm text-body">
                Current status: <span className="font-medium text-heading capitalize">{batchStatus.split('_').join(' ')}</span>
              </p>
            ) : null}
            <p className="text-sm text-body">See which slots are open without exposing anyone's booking details.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Booked seats', value: stats.total },
              { label: 'Open seats', value: stats.openSeats },
              { label: 'Open slots', value: stats.openSlots },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-muted bg-secondary p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-body">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-heading">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
          {slots.length === 0 ? (
            <div className="rounded-2xl border border-muted bg-secondary p-8 text-center text-body shadow-sm">
              No slots available yet.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(slotsByDay)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([dayKey, daySlots]) => (
                  <div key={dayKey}>
                    <h2 className="mb-4 text-lg font-semibold text-heading">{formatDay(dayKey)}</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {daySlots
                        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                        .map((slot) => {
                          const isFull = slot.booking_count >= slot.capacity;

                          return (
                            <div
                              key={slot.id}
                              className="rounded-2xl border border-muted bg-secondary p-4 shadow-sm"
                            >
                              <div className="mb-3 flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-heading">
                                    {formatTimeRange(slot.start_time, slot.end_time)}
                                  </p>
                                  <p className="text-xs text-body">
                                    {slot.booking_count} / {slot.capacity} booked
                                  </p>
                                </div>
                                <div
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    isFull
                                      ? 'bg-emerald-500/10 text-emerald-700'
                                      : 'bg-amber-500/10 text-amber-700'
                                  }`}
                                >
                                  {isFull ? 'Full' : 'Open'}
                                </div>
                              </div>

                              <div className="space-y-2 rounded-xl border border-muted bg-white p-3 shadow-sm">
                                <p className="text-xs text-body">
                                  {slot.booking_count === 0
                                    ? 'No bookings yet'
                                    : `${slot.booking_count} seat${slot.booking_count === 1 ? '' : 's'} booked`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
