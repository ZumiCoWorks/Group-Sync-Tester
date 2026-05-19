'use client';

import type { ReactNode } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smartphone, Lock, Send, CalendarCheck2, ShieldCheck, Clock3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSlotBookingAuth } from '../auth/slot-booking-auth';
import { useSlotBookingStore } from '../store/use-slot-booking-store';

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
  const panelClass = 'rounded-3xl border border-border bg-background p-6 text-foreground';
  const summaryClass = 'rounded-2xl border border-border bg-muted/30';

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
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="space-y-6">
        <section className={panelClass}>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Student booking</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Book on mobile, fast</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Only published slots are visible here, with a compact touch-friendly flow.</p>
            </div>
            <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">Student lane</Badge>
          </div>

          <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            <SummaryStat label="Open" value={`${openSlots.length}`} icon={<CalendarCheck2 className="h-4 w-4" />} className={summaryClass} />
            <SummaryStat label="Claimed" value={`${bookedSlots.length}`} icon={<ShieldCheck className="h-4 w-4" />} className={summaryClass} />
            <SummaryStat label="Pace" value="One slot" icon={<Clock3 className="h-4 w-4" />} className={summaryClass} />
          </div>
        </section>

        <section className={panelClass}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Quick details</p>
              <h3 className="text-xl font-semibold">Your booking identity</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Student name</Label>
              <Input value={studentName} onChange={(event) => setStudentName(event.target.value)} className="h-11 rounded-xl border-border bg-background text-foreground" placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Student email</Label>
              <Input value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} className="h-11 rounded-xl border-border bg-background text-foreground" placeholder="name@afda.ac.za" />
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Smartphone className="h-4 w-4 text-emerald-600" />
                Fast booking with one-slot-per-student protection.
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600" />
                {bookedSlots.length} booking{bookedSlots.length === 1 ? '' : 's'} already claimed.
              </div>
              {message && <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">{message}</p>}
            </div>
          </div>
        </section>
      </div>

      {loading ? (
        <section className={panelClass}>
          <p className="text-sm text-muted-foreground">Loading slots…</p>
        </section>
      ) : (
        <section className={panelClass}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Published slots</p>
              <h3 className="text-xl font-semibold">Tap to claim</h3>
            </div>
            <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">{openSlots.length} open</Badge>
          </div>

          <ScrollArea className="mt-5 h-[420px] pr-2 md:h-[560px] md:pr-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openSlots.map((slot) => (
                  <TableRow key={slot.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-foreground">{slot.locationLabel}</TableCell>
                    <TableCell className="text-muted-foreground">{slot.date} · {slot.startTime} - {slot.endTime}</TableCell>
                    <TableCell className="text-muted-foreground">{slot.ownerName} · {slot.ownerRole}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" size="sm" className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600" onClick={() => book(slot.id)}>
                        <Send className="mr-2 h-4 w-4" />
                        Book
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!openSlots.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No open slots available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-sm font-medium">Recent bookings</p>
            <div className="mt-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookedSlots.slice(0, 4).map((slot) => (
                    <TableRow key={slot.id}>
                      <TableCell className="text-foreground">{slot.locationLabel}</TableCell>
                      <TableCell className="text-muted-foreground">{slot.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">{slot.startTime}</TableCell>
                    </TableRow>
                  ))}
                  {!bookedSlots.length && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        Bookings will appear here instantly once claimed.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>
      )}
      </div>
    );
  }

  function SummaryStat({ label, value, icon, className }: { label: string; value: string; icon: ReactNode; className: string }) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      </div>
    );
  }