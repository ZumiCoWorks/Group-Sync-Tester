'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smartphone, Lock, Send } from 'lucide-react';
import { useSlotBookingAuth } from '../auth/slot-booking-auth';
import { useSlotBookingStore } from '../store/use-slot-booking-store';

export function SlotBookingStudentPage() {
  const { user } = useSlotBookingAuth();
  const store = useSlotBookingStore(user);
  const [studentName, setStudentName] = useState(user.displayName);
  const [studentEmail, setStudentEmail] = useState(user.email);
  const [message, setMessage] = useState('');

  const openSlots = useMemo(() => store.slots.filter((slot) => slot.status === 'open'), [store.slots]);
  const bookedSlots = useMemo(() => store.bookings, [store.bookings]);

  const book = async (slotId: string) => {
    try {
      const booking = await store.bookSlot({
        slotId,
        studentName,
        studentEmail,
        tutor: user,
      });
      setMessage(`Booked ${booking.venueName} at ${booking.startTime}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Booking failed');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-border bg-card p-6 text-card-foreground shadow-xl shadow-orange-500/5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Student Booking Portal</p>
        <h2 className="mt-2 text-3xl font-black">One student, one slot.</h2>
        <p className="mt-3 text-sm text-muted-foreground">Mobile-first booking with instant gray-out once a slot is claimed.</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Student name</Label>
            <Input value={studentName} onChange={(event) => setStudentName(event.target.value)} className="border-border bg-background text-foreground" placeholder="Your full name" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Student email</Label>
            <Input value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} className="border-border bg-background text-foreground" placeholder="name@afda.ac.za" />
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Smartphone className="h-4 w-4 text-primary" />
              WhatsApp-style speed, but with one-slot-per-student protection.
            </div>
            <div className="mt-2 flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4 text-primary" />
              {store.bookings.length} booking{store.bookings.length === 1 ? '' : 's'} already claimed.
            </div>
            {message && <p className="mt-2 text-emerald-600">{message}</p>}
          </div>
        </div>
      </Card>

      <Card className="border-border bg-card p-6 text-card-foreground shadow-xl shadow-orange-500/5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Available slots</p>
            <h3 className="text-2xl font-black">Gray-out claimable entries</h3>
          </div>
          <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">{openSlots.length} open</Badge>
        </div>

        <ScrollArea className="mt-6 h-[520px] pr-3">
          <div className="grid gap-3">
            {openSlots.map((slot) => (
              <div key={slot.id} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{slot.venueName}</p>
                    <p className="text-xs text-muted-foreground">
                      {slot.date} · {slot.startTime} - {slot.endTime}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Tutor: {slot.tutorName}</p>
                  </div>
                  <Button onClick={() => book(slot.id)} className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90">
                    <Send className="mr-2 h-4 w-4" />
                    Book
                  </Button>
                </div>
              </div>
            ))}
            {!openSlots.length && <p className="text-sm text-muted-foreground">No open slots available.</p>}
          </div>
        </ScrollArea>

        <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4">
          <p className="text-sm font-bold">Booked slots</p>
          <div className="mt-3 space-y-2">
            {bookedSlots.slice(0, 4).map((slot) => (
              <div key={slot.id} className="rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">
                {slot.venueName} · {slot.studentName} · {slot.startTime}
              </div>
            ))}
            {!bookedSlots.length && <p className="text-sm text-muted-foreground">Bookings will appear here instantly once claimed.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}