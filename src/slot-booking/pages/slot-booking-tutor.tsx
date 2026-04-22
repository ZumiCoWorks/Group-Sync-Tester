'use client';

import { useMemo, useState } from 'react';
import { CalendarPlus2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLockoutCopy, isLocked } from '@/worksuite/config';
import { useSlotBookingAuth } from '../auth/slot-booking-auth';
import { useSlotBookingStore } from '../store/use-slot-booking-store';

export function SlotBookingTutorPage() {
  const { user } = useSlotBookingAuth();
  const store = useSlotBookingStore(user);
  const [venueId, setVenueId] = useState(store.venues[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [slotCount, setSlotCount] = useState(6);
  const [tutorName, setTutorName] = useState(user.displayName);
  const [statusMessage, setStatusMessage] = useState('');
  const locked = isLocked(date);

  const venue = store.venues.find((item) => item.id === venueId || item.venueId === venueId) || store.venues[0];
  const venueSlots = useMemo(() => store.slots.filter((slot) => slot.venueId === venue?.id), [store.slots, venue?.id]);

  const createSlots = async () => {
    if (!venue) return;
    const created = await store.createSlots({
      venueId: venue.id,
      tutorName,
      date,
      startTime,
      durationMinutes,
      slotCount,
    });
    setStatusMessage(`Created ${created.length} slot${created.length === 1 ? '' : 's'} for ${venue.roomName}.`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-border bg-card p-6 text-card-foreground shadow-xl shadow-orange-500/5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Lecturer Booking Desk</p>
        <h2 className="mt-2 text-3xl font-black">Slot Generator</h2>
        <p className="mt-3 text-sm text-muted-foreground">Lecturers select a venue and generate assessment windows.</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Lecturer name</Label>
            <Input value={tutorName} onChange={(event) => setTutorName(event.target.value)} className="border-border bg-background text-foreground placeholder:text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Venue</Label>
            <select value={venueId} onChange={(event) => setVenueId(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none">
              {store.venues.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.roomName} · {item.campus}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground">Date</Label>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="border-border bg-background text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Start time</Label>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="border-border bg-background text-foreground" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-foreground">Duration (minutes)</Label>
              <Input type="number" min={5} step={5} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="border-border bg-background text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Slot count</Label>
              <Input type="number" min={1} max={20} value={slotCount} onChange={(event) => setSlotCount(Number(event.target.value))} className="border-border bg-background text-foreground" />
            </div>
          </div>

          <Button onClick={createSlots} disabled={locked || !venue} className="w-full rounded-full bg-primary px-6 py-6 text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <CalendarPlus2 className="mr-2 h-4 w-4" />
            {locked ? 'Schedule Locked' : 'Create Slots'}
          </Button>

          <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-foreground">
              <Lock className="h-4 w-4 text-primary" />
              {getLockoutCopy()}
            </div>
            {statusMessage && <p className="mt-2 text-emerald-600">{statusMessage}</p>}
          </div>
        </div>
      </Card>

      <Card className="border-border bg-card p-6 text-card-foreground shadow-xl shadow-orange-500/5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Live Slots</p>
            <h3 className="text-2xl font-black">Venue schedule</h3>
          </div>
          <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">{store.summary.openSlotCount} open</Badge>
        </div>

        <ScrollArea className="mt-6 h-[520px] pr-3">
          <div className="space-y-3">
            {venueSlots.map((slot) => (
              <div key={slot.id} className="rounded-2xl border border-border bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{slot.venueName}</p>
                    <p className="text-xs text-muted-foreground">
                      {slot.date} · {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                  <Badge className={slot.status === 'open' ? 'rounded-full bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20' : 'rounded-full bg-secondary text-foreground hover:bg-secondary'}>{slot.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Tutor: {slot.tutorName}</p>
              </div>
            ))}
            {!venueSlots.length && <p className="text-sm text-muted-foreground">No slots created yet.</p>}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}