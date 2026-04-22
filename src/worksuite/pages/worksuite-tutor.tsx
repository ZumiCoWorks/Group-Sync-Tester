'use client';

import { useMemo, useState } from 'react';
import { CalendarPlus2, Clock3, Lock, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLockoutCopy, isLocked } from '../config';
import { useWorksuiteAuth } from '../auth/worksuite-auth';
import { WorksuiteRoleGuard } from '../components/role-guard';
import { useWorksuiteStore } from '../store/use-worksuite-store';

export function WorksuiteTutorPage() {
  const { user } = useWorksuiteAuth();
  const store = useWorksuiteStore(user);
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
    <WorksuiteRoleGuard
      allowedRoles={['staff']}
      title="Lecturer slot creation is reserved for Staff"
      description="Only the lecturer view may generate assessment slots. Switch into the staff role to continue."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">Tutor Assessment Suite</p>
        <h2 className="mt-2 text-3xl font-black">Slot Generator</h2>
        <p className="mt-3 text-sm text-white/70">Tutors select a venue, define the duration, and generate bookable assessment windows.</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-white/80">Tutor name</Label>
            <Input value={tutorName} onChange={(event) => setTutorName(event.target.value)} className="border-white/10 bg-black text-white placeholder:text-white/30" />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Venue</Label>
            <select
              value={venueId}
              onChange={(event) => setVenueId(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white outline-none"
            >
              {store.venues.map((item) => (
                <option key={item.id} value={item.id}>{item.roomName} · {item.campus}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white/80">Date</Label>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="border-white/10 bg-black text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Start time</Label>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="border-white/10 bg-black text-white" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white/80">Duration (minutes)</Label>
              <Input type="number" min={5} step={5} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="border-white/10 bg-black text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Slot count</Label>
              <Input type="number" min={1} max={20} value={slotCount} onChange={(event) => setSlotCount(Number(event.target.value))} className="border-white/10 bg-black text-white" />
            </div>
          </div>

          <Button
            onClick={createSlots}
            disabled={locked || !venue}
            className="w-full rounded-full bg-[#ff6f4d] px-6 py-6 text-black hover:bg-[#ff8a68] disabled:opacity-50"
          >
            <CalendarPlus2 className="mr-2 h-4 w-4" />
            {locked ? 'Schedule Locked' : 'Create Slots'}
          </Button>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
            <div className="flex items-center gap-2 text-white">
              <Lock className="h-4 w-4 text-[#ff6f4d]" />
              {getLockoutCopy()}
            </div>
            <p className="mt-2">CalendarService is mocked now: it logs the event and writes an audit record ready for Microsoft Graph later.</p>
            {statusMessage && <p className="mt-2 text-emerald-300">{statusMessage}</p>}
          </div>
        </div>
      </Card>

        <Card className="border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Live Slots</p>
            <h3 className="text-2xl font-black">Venue schedule</h3>
          </div>
          <Badge className="rounded-full bg-white/10 px-3 py-1 text-white hover:bg-white/10">{store.summary.openSlotCount} open</Badge>
        </div>

        <ScrollArea className="mt-6 h-[520px] pr-3">
          <div className="space-y-3">
            {venueSlots.map((slot) => (
              <div key={slot.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{slot.venueName}</p>
                    <p className="text-xs text-white/60">{slot.date} · {slot.startTime} - {slot.endTime}</p>
                  </div>
                  <Badge className={slot.status === 'open' ? 'rounded-full bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/20' : 'rounded-full bg-white/10 text-white hover:bg-white/10'}>
                    {slot.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-white/60">Tutor: {slot.tutorName}</p>
              </div>
            ))}
            {!venueSlots.length && <p className="text-sm text-white/55">No slots created yet.</p>}
          </div>
        </ScrollArea>
        </Card>
      </div>
    </WorksuiteRoleGuard>
  );
}
