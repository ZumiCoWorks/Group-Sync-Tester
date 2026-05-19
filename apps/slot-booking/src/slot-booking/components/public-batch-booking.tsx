'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { useSlotBookingStore } from '../store/use-slot-booking-store';

export function PublicBatchBooking({ batchId }: { batchId: string }) {
  const store = useSlotBookingStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const openSlots = useMemo(() => store.slots.filter((s) => s.batchId === batchId && s.status === 'open' && s.isPublished), [store.slots, batchId]);
  const batch = useMemo(() => store.slotBatches.find((b) => b.id === batchId), [store.slotBatches, batchId]);
  const batchDiscipline = batch?.discipline ?? '';

  const book = async (slotId: string) => {
    setMessage('');
    try {
      const studentEmail = email.trim() || '';
      const studentName = name.trim() || 'Student';
      const res = await store.bookSlot({ slotId, studentName, studentEmail, tutor: { email: '' } });
      setMessage(`Booked ${res.locationLabel} at ${res.startTime}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Booking failed');
    }
  };

  // No session defaults for public booking; students enter their name/email manually.

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
      <Card className="p-4 sm:p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Student booking</p>
        <h2 className="mt-2 text-2xl font-black">Choose a slot</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Enter your name and email, then tap a slot to claim it.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {batchDiscipline && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
              Discipline: <strong className="ml-2">{batchDiscipline}</strong>
            </div>
          )}
          <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} className="h-12" />
          <Input placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Available slots</p>
          <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">{openSlots.length} open</Badge>
        </div>

        <ScrollArea className="mt-4 h-[55vh] sm:h-[420px]">
          <div className="space-y-3">
            {openSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{slot.locationLabel}</div>
                  <div className="text-xs text-muted-foreground">{slot.date} · {slot.startTime} - {slot.endTime}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => book(slot.id)} className="rounded-full bg-emerald-600 px-4 text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Book
                  </Button>
                </div>
              </div>
            ))}
            {!openSlots.length && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No open slots available for this batch yet.
              </div>
            )}
          </div>
        </ScrollArea>

        {message && <div className="mt-4 rounded-md bg-emerald-50 p-3 text-emerald-700">{message}</div>}
      </Card>
    </div>
  );
}
