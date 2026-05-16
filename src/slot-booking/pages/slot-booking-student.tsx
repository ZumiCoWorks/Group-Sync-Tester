'use client';

import type { ReactNode } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smartphone, Lock, Send, CalendarCheck2, ShieldCheck, Clock3 } from 'lucide-react';
import { useSlotBookingAuth } from '../auth/slot-booking-auth';
import { useSlotBookingStore } from '../store/use-slot-booking-store';
import { CardSkeleton, FormSkeleton, ListSkeleton, MetricSkeleton } from '../components/skeleton-loaders';

export function SlotBookingStudentPage() {
  const { user } = useSlotBookingAuth();
  const store = useSlotBookingStore(user);
  const [studentName, setStudentName] = useState(user.displayName);
  const [studentEmail, setStudentEmail] = useState(user.email);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading - remove this if store loads automatically
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const openSlots = useMemo(() => store.slots.filter((slot) => slot.status === 'open' && slot.isPublished), [store.slots]);
  const bookedSlots = useMemo(() => store.bookings, [store.bookings]);
  const panelClass = 'border border-emerald-100/60 bg-white/95 p-5 text-slate-900 shadow-sm';

  const book = async (slotId: string) => {
    try {
      const booking = await store.bookSlot({
        slotId,
        studentName,
        studentEmail,
        tutor: user,
      });
      setMessage(`Booked ${booking.locationLabel} at ${booking.startTime}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Booking failed');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="space-y-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card className={panelClass}>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Student booking</p>
              <h2 className="mt-1 text-2xl font-semibold">Book on mobile, fast</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Only published slots are visible here, with a compact touch-friendly flow.</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat label="Open" value={`${openSlots.length}`} icon={<CalendarCheck2 className="h-4 w-4" />} />
                <Stat label="Claimed" value={`${bookedSlots.length}`} icon={<ShieldCheck className="h-4 w-4" />} />
                <Stat label="Pace" value="One slot" icon={<Clock3 className="h-4 w-4" />} />
              </div>
            </Card>

            <Card className={panelClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Quick details</p>
                  <h3 className="text-xl font-semibold">Your booking identity</h3>
                </div>
                <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">Student lane</Badge>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Student name</Label>
                  <Input value={studentName} onChange={(event) => setStudentName(event.target.value)} className="h-12 rounded-2xl border-border bg-background text-foreground" placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Student email</Label>
                  <Input value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} className="h-12 rounded-2xl border-border bg-background text-foreground" placeholder="name@afda.ac.za" />
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2 font-semibold text-slate-950">
                    <Smartphone className="h-4 w-4 text-emerald-700" />
                    Fast booking with one-slot-per-student protection.
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-slate-600">
                    <Lock className="h-4 w-4 text-emerald-700" />
                    {bookedSlots.length} booking{bookedSlots.length === 1 ? '' : 's'} already claimed.
                  </div>
                  {message && <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-emerald-700 shadow-sm">{message}</p>}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {loading ? (
        <CardSkeleton />
      ) : (
        <Card className="border border-emerald-100/60 bg-white/95 p-4 text-slate-900 shadow-sm md:p-5">
          <div className="flex items-center justify-between gap-3 px-2 pt-1">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Published slots</p>
              <h3 className="text-xl font-semibold">Tap to claim</h3>
            </div>
            <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">{openSlots.length} open</Badge>
          </div>

          <ScrollArea className="mt-5 h-[420px] pr-2 md:h-[560px] md:pr-3">
            <div className="space-y-3">
              {openSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => book(slot.id)}
                className="w-full rounded-2xl border border-emerald-100 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-slate-950">{slot.locationLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {slot.date} · {slot.startTime} - {slot.endTime}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-emerald-700">Owner: {slot.ownerName} · {slot.ownerRole}</p>
                  </div>
                  <span className="inline-flex h-10 items-center rounded-full bg-emerald-600 px-4 text-sm font-medium text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Book
                  </span>
                </div>
              </button>
            ))}
            {!openSlots.length && <p className="rounded-2xl border border-dashed border-emerald-200 p-4 text-sm text-muted-foreground">No open slots available.</p>}
          </div>
        </ScrollArea>

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-sm font-semibold text-slate-950">Recent bookings</p>
          <div className="mt-3 space-y-2">
            {bookedSlots.slice(0, 4).map((slot) => (
              <div key={slot.id} className="rounded-xl border border-border bg-white p-3 text-sm text-slate-600">
                <div className="font-semibold text-slate-950">{slot.locationLabel}</div>
                <div className="mt-1 text-xs text-slate-500">{slot.studentName} · {slot.startTime}</div>
              </div>
            ))}
            {!bookedSlots.length && <p className="text-sm text-muted-foreground">Bookings will appear here instantly once claimed.</p>}
          </div>
        </div>
      </Card>
      )}
      </div>
    );
  }

  function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
    return (
      <div className="rounded-2xl border border-border bg-slate-50/80 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      </div>
    );
  }