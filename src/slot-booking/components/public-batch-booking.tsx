'use client';

import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogIn, Send } from 'lucide-react';
import { useSlotBookingStore } from '../store/use-slot-booking-store';
import { signIn, useSession } from 'next-auth/react';

export function PublicBatchBooking({ batchId }: { batchId: string }) {
  const store = useSlotBookingStore();
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const isSignedIn = Boolean(session?.user?.email);
  const openSlots = useMemo(() => store.slots.filter((s) => s.batchId === batchId && s.status === 'open' && s.isPublished), [store.slots, batchId]);

  const book = async (slotId: string) => {
    setMessage('');
    // Require authentication to perform booking. If not signed in, redirect to sign in and return.
    if (!session?.user?.email) {
      signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    try {
      const studentEmail = email.trim() || session.user.email || '';
      const studentName = name.trim() || session.user.name || 'Student';
      const res = await store.bookSlot({ slotId, studentName, studentEmail, tutor: { email: '' } });
      setMessage(`Booked ${res.locationLabel} at ${res.startTime}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Booking failed');
    }
  };

  useEffect(() => {
    if (session?.user) {
      if (!name && session.user.name) setName(session.user.name);
      if (!email && session.user.email) setEmail(session.user.email);
    }
  }, [session]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4">
      <Card className="p-6">
        <p className="text-xs uppercase text-muted-foreground">Group Booking</p>
        <h2 className="mt-2 text-2xl font-bold">Choose a slot</h2>
        <p className="mt-2 text-sm text-muted-foreground">Tap a slot below to claim it. Enter your name and email so we can confirm your booking.</p>

        <div className="mt-4 grid gap-3">
          {!isSignedIn && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              You can view all slots without signing in. Sign in is required only when you click Book.
            </div>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Available slots</p>
          <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">{openSlots.length} open</Badge>
        </div>

        <ScrollArea className="mt-4 h-[420px]">
          <div className="space-y-3">
            {openSlots.map((slot) => (
              <div key={slot.id} className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{slot.locationLabel}</div>
                  <div className="text-xs text-muted-foreground">{slot.date} · {slot.startTime} - {slot.endTime}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => book(slot.id)} className="rounded-full bg-emerald-600 px-4 text-white">
                    {isSignedIn ? <Send className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
                    {isSignedIn ? 'Book' : 'Sign in to book'}
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
