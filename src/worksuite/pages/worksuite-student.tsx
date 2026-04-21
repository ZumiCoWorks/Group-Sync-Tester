'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smartphone, Lock, Send } from 'lucide-react';
import { useWorksuiteAuth } from '../auth/worksuite-auth';
import { useWorksuiteStore } from '../store/use-worksuite-store';

export function WorksuiteStudentPage() {
  const { user } = useWorksuiteAuth();
  const store = useWorksuiteStore(user);
  const [studentName, setStudentName] = useState(user.role === 'student' ? user.displayName : '');
  const [studentEmail, setStudentEmail] = useState(user.role === 'student' ? user.email : '');
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
      <Card className="border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">Student Booking Portal</p>
        <h2 className="mt-2 text-3xl font-black">One student, one slot.</h2>
        <p className="mt-3 text-sm text-white/70">Mobile-first booking with instant gray-out once a slot is claimed.</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-white/80">Student name</Label>
            <Input value={studentName} onChange={(event) => setStudentName(event.target.value)} className="border-white/10 bg-black text-white" placeholder="Your full name" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Student email</Label>
            <Input value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} className="border-white/10 bg-black text-white" placeholder="name@afda.ac.za" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
            <div className="flex items-center gap-2 text-white">
              <Smartphone className="h-4 w-4 text-[#ff6f4d]" />
              WhatsApp-style speed, but with one-slot-per-student protection.
            </div>
            <div className="mt-2 flex items-center gap-2 text-white/70">
              <Lock className="h-4 w-4 text-[#ff6f4d]" />
              {store.bookings.length} booking{store.bookings.length === 1 ? '' : 's'} already claimed.
            </div>
            {message && <p className="mt-2 text-emerald-300">{message}</p>}
          </div>
        </div>
      </Card>

      <Card className="border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Available slots</p>
            <h3 className="text-2xl font-black">Gray-out claimable entries</h3>
          </div>
          <Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">{openSlots.length} open</Badge>
        </div>

        <ScrollArea className="mt-6 h-[520px] pr-3">
          <div className="grid gap-3">
            {openSlots.map((slot) => (
              <div key={slot.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{slot.venueName}</p>
                    <p className="text-xs text-white/60">{slot.date} · {slot.startTime} - {slot.endTime}</p>
                    <p className="mt-1 text-xs text-white/60">Tutor: {slot.tutorName}</p>
                  </div>
                  <Button onClick={() => book(slot.id)} className="rounded-full bg-[#ff6f4d] px-4 text-black hover:bg-[#ff8a68]">
                    <Send className="mr-2 h-4 w-4" />
                    Book
                  </Button>
                </div>
              </div>
            ))}
            {!openSlots.length && <p className="text-sm text-white/55">No open slots available.</p>}
          </div>
        </ScrollArea>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
          <p className="text-sm font-bold">Booked slots</p>
          <div className="mt-3 space-y-2">
            {bookedSlots.slice(0, 4).map((slot) => (
              <div key={slot.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                {slot.venueName} · {slot.studentName} · {slot.startTime}
              </div>
            ))}
            {!bookedSlots.length && <p className="text-sm text-white/55">Bookings will appear here instantly once claimed.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}
