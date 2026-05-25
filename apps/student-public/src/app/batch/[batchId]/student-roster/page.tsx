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

type BookingInfo = {
  id: string;
  student_name: string;
  student_email: string;
  status: string;
  slot_id: string;
};

type RosterData = {
  batch: { id: string; title: string; status: string; booking_count?: number; total_slots?: number };
  slots: SlotInfo[];
  bookings: BookingInfo[];
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-core-backend-bmi3qmvu5-zcw-nav-eaze.vercel.app' : 'http://localhost:3001');

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
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [bookings, setBookings] = useState<BookingInfo[]>([]);

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
        setSlots(slotsData.data || []);

        // Fetch bookings (public endpoint that returns aggregate data for published batches)
        const bookingsRes = await fetch(`${backendUrl}/api/batches/${batchId}/bookings-public`);
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData.data || []);
        }
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

  const bookingsBySlotId = useMemo(() => {
    return bookings.reduce<Record<string, BookingInfo[]>>((acc, booking) => {
      acc[booking.slot_id] = acc[booking.slot_id] || [];
      acc[booking.slot_id].push(booking);
      return acc;
    }, {});
  }, [bookings]);

  const stats = useMemo(
    () => ({
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    }),
    [bookings]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-slate-200">
        <p className="text-lg">Loading roster…</p>
      </div>
    );
  }

  if (error && !batchTitle) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-3xl font-semibold text-white">Roster unavailable</h1>
          <p className="text-slate-300">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.20),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push(`/batch/${batchId}`)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Back to booking
          </button>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              Who's attending
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{batchTitle}</h1>
            <p className="text-sm text-slate-300">See who's booked each slot.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Total bookings', value: stats.total },
              { label: 'Confirmed', value: stats.confirmed },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {slots.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
              No slots available yet.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(slotsByDay)
                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                .map(([dayKey, daySlots]) => (
                  <div key={dayKey}>
                    <h2 className="mb-4 text-lg font-semibold text-white">{formatDay(dayKey)}</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {daySlots
                        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                        .map((slot) => {
                          const slotBookings = bookingsBySlotId[slot.id] || [];
                          const isFull = slot.booking_count >= slot.capacity;

                          return (
                            <div
                              key={slot.id}
                              className="rounded-2xl border border-white/10 bg-white/5 p-4"
                            >
                              <div className="mb-3 flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-white">
                                    {formatTimeRange(slot.start_time, slot.end_time)}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {slot.booking_count} / {slot.capacity} booked
                                  </p>
                                </div>
                                <div
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    isFull
                                      ? 'bg-emerald-400/10 text-emerald-200'
                                      : 'bg-amber-400/10 text-amber-200'
                                  }`}
                                >
                                  {isFull ? 'Full' : 'Open'}
                                </div>
                              </div>

                              <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                                {slotBookings.length === 0 ? (
                                  <p className="text-xs text-slate-300">No bookings yet</p>
                                ) : (
                                  slotBookings.map((b) => (
                                    <div key={b.id} className="text-xs">
                                      <p className="font-medium text-slate-100">{b.student_name}</p>
                                      <p className="text-slate-400">{b.student_email}</p>
                                    </div>
                                  ))
                                )}
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
