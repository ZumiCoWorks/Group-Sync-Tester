'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

type RosterBooking = {
  id: string;
  confirmation_number: string;
  student_name: string;
  student_email: string;
  status: 'confirmed' | 'waitlisted' | 'cancelled' | 'attended';
  booked_at: string;
  slot?: {
    id: string;
    start_time: string;
    end_time: string;
    capacity: number;
    booking_count: number;
  } | null;
};

type RosterResponse = {
  success: boolean;
  data?: {
    batch: {
      id: string;
      title: string;
      status: string;
      booking_count?: number;
      total_slots?: number;
    };
    slots: Array<{
      id: string;
      batch_id: string;
      start_time: string;
      end_time: string;
      capacity: number;
      booking_count: number;
    }>;
    bookings: RosterBooking[];
  };
  error?: { code: string; message: string };
};

type SlotType = {
  id: string;
  batch_id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booking_count: number;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-core-backend.vercel.app' : 'http://localhost:3001');

const formatDay = (value: string) =>
  new Date(value).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

const formatTimeRange = (startTime: string, endTime: string) =>
  `${new Date(startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${new Date(endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

export default function LecturerRosterPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const batchId = params.batchId as string;
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [batchTitle, setBatchTitle] = useState('');
  const [slots, setSlots] = useState<SlotType[]>([]);
  const [bookings, setBookings] = useState<RosterBooking[]>([]);

  useEffect(() => {
    const loadRoster = async () => {
      setLoading(true);
      setError('');

      if (!batchId || !token) {
        setError('This roster link is incomplete.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/api/batches/${batchId}/roster?token=${encodeURIComponent(token)}`);
        const payload = (await response.json()) as RosterResponse;

        if (!response.ok || !payload.success || !payload.data) {
          setError(payload.error?.message || 'Roster unavailable.');
          return;
        }

        setBatchTitle(payload.data.batch.title);
        setSlots(payload.data.slots || []);
        setBookings(payload.data.bookings || []);
      } catch (loadError) {
        setError('Unable to reach the backend.');
      } finally {
        setLoading(false);
      }
    };

    void loadRoster();
  }, [batchId, token]);

  const stats = useMemo(() => ({
    total: bookings.length,
    confirmed: bookings.filter((booking) => booking.status === 'confirmed').length,
    attended: bookings.filter((booking) => booking.status === 'attended').length,
  }), [bookings]);

  const bookingsBySlotId = useMemo(() => {
    return bookings.reduce<Record<string, RosterBooking[]>>((accumulator, booking) => {
      const slotId = booking.slot?.id;
      if (!slotId) return accumulator;
      accumulator[slotId] = accumulator[slotId] || [];
      accumulator[slotId].push(booking);
      return accumulator;
    }, {});
  }, [bookings]);

  const slotsByDay = useMemo(() => {
    return slots.reduce<Record<string, SlotType[]>>((accumulator, slot) => {
      const dayKey = new Date(slot.start_time).toDateString();
      accumulator[dayKey] = accumulator[dayKey] || [];
      accumulator[dayKey].push(slot);
      return accumulator;
    }, {} as Record<string, SlotType[]>);
  }, [slots]);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push(`/batch/${batchId}`)}
            className="rounded-2xl border border-muted bg-white px-4 py-2 text-sm font-medium text-heading shadow-sm transition hover:bg-secondary"
          >
            Back to booking page
          </button>
          <span className="rounded-full border border-muted bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-body shadow-sm">
            Public roster
          </span>
        </div>

        <section className="rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-accent-business/20 bg-accent-business/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-business">
              Lecturer view
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-heading">{batchTitle || 'Batch roster'}</h1>
            <p className="text-sm text-body">
              This link is public, but only works with the roster token shared by the batch creator.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Bookings', value: stats.total },
              { label: 'Confirmed', value: stats.confirmed },
              { label: 'Attended', value: stats.attended },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-muted bg-secondary p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-body">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold text-heading">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
          {loading ? (
            <div className="text-sm text-body">Loading roster…</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-700">
              {error}
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-2xl border border-muted bg-secondary p-8 text-center text-body">
              No slots are available for this batch yet.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(slotsByDay)
                .sort(([left], [right]) => new Date(left).getTime() - new Date(right).getTime())
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
                            <div key={slot.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
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
                                {slotBookings.length === 0 ? (
                                  <p className="text-xs text-body">No bookings yet</p>
                                ) : (
                                  slotBookings.map((b) => (
                                    <div key={b.id} className="text-xs">
                                      <p className="font-medium text-heading">{b.student_name}</p>
                                      <p className="text-body">{b.student_email}</p>
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