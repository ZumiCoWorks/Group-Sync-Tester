'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus2, Lock, MapPin, Megaphone, PencilLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { getLockoutCopy, isLocked } from '@/worksuite/config';
import { listActiveDelegationsForTutor } from '@/worksuite/authority';
import type { SlotLocationMode } from '@/worksuite/types';
import { useSlotBookingAuth } from '../auth/slot-booking-auth';
import { useSlotBookingStore } from '../store/use-slot-booking-store';

function parseDateList(input: string) {
  return Array.from(
    new Set(
      input
        .split(/[,\n]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export function SlotBookingTutorPage() {
  const { user } = useSlotBookingAuth();
  const store = useSlotBookingStore(user);
  const [locationMode, setLocationMode] = useState<SlotLocationMode>('allocated');
  const [venueId, setVenueId] = useState(store.venues[0]?.id || '');
  const [customLocation, setCustomLocation] = useState('');
  const [slotOwnerMode, setSlotOwnerMode] = useState<'self' | 'lecturer'>('self');
  const [lecturerName, setLecturerName] = useState('');
  const [lecturerEmail, setLecturerEmail] = useState('');
  const [dateList, setDateList] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [slotCount, setSlotCount] = useState(6);
  const [tutorName, setTutorName] = useState(user.displayName);
  const [statusMessage, setStatusMessage] = useState('');
  const [mounted, setMounted] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedBatchLabel, setSelectedBatchLabel] = useState('');
  const [lunchStartTime, setLunchStartTime] = useState('12:30');
  const [lunchEndTime, setLunchEndTime] = useState('13:30');
  const [publishError, setPublishError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const venue = store.venues.find((item) => item.id === venueId || item.venueId === venueId) || store.venues[0];
  const draftBatches = useMemo(() => store.slotBatches.filter((batch) => !batch.isPublished), [store.slotBatches]);
  const activeDelegations = useMemo(() => listActiveDelegationsForTutor(store.delegations, user.email), [store.delegations, user.email]);
  const parsedDates = useMemo(() => parseDateList(dateList), [dateList]);
  const lockedDates = useMemo(() => parsedDates.filter((targetDate) => isLocked(targetDate)), [parsedDates]);
  const selectedBatchSlots = useMemo(
    () => store.slots.filter((slot) => slot.batchId === selectedBatchId),
    [selectedBatchId, store.slots],
  );

  const lunchExclusionPreviewCount = useMemo(() => {
    if (!lunchStartTime || !lunchEndTime) {
      return 0;
    }

    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map((value) => Number(value));
      return hours * 60 + minutes;
    };

    const lunchStart = toMinutes(lunchStartTime);
    const lunchEnd = toMinutes(lunchEndTime);

    if (lunchEnd <= lunchStart) {
      return 0;
    }

    return selectedBatchSlots.filter((slot) => {
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = toMinutes(slot.endTime);
      return slotStart < lunchEnd && lunchStart < slotEnd;
    }).length;
  }, [lunchEndTime, lunchStartTime, selectedBatchSlots]);

  const createSlots = async () => {
    if (!parsedDates.length) {
      setStatusMessage('Add at least one date before creating slots.');
      return;
    }

    const createdLocations: string[] = [];
    const skippedDates: string[] = [];
    let createdSlotTotal = 0;

    for (const targetDate of parsedDates) {
      try {
        const created = await store.createSlots({
          locationMode,
          venueId: venue?.id,
          customLocation,
          tutorName,
          ownerName: slotOwnerMode === 'lecturer' ? lecturerName || 'Lecturer' : tutorName,
          ownerEmail: slotOwnerMode === 'lecturer' ? lecturerEmail : user.email,
          ownerRole: slotOwnerMode === 'lecturer' ? 'lecturer' : 'tutor',
          createdBy: user.displayName,
          createdByRole: 'tutor',
          date: targetDate,
          startTime,
          durationMinutes,
          slotCount,
        });

        createdLocations.push(created.batch.locationLabel);
        createdSlotTotal += created.slots.length;
      } catch (error) {
        skippedDates.push(`${targetDate}${error instanceof Error ? ` (${error.message})` : ''}`);
      }
    }

    if (!createdSlotTotal) {
      setStatusMessage(skippedDates[0] ? `No slots created. ${skippedDates[0]}` : 'No slots created.');
      return;
    }

    setStatusMessage(
      `Created ${createdSlotTotal} draft slot${createdSlotTotal === 1 ? '' : 's'} across ${createdLocations.length} day${createdLocations.length === 1 ? '' : 's'}.` +
      (skippedDates.length ? ` Skipped ${skippedDates.length} day${skippedDates.length === 1 ? '' : 's'}.` : ''),
    );
  };

  const openPublishModal = (batchId: string, locationLabel: string) => {
    setSelectedBatchId(batchId);
    setSelectedBatchLabel(locationLabel);
    setPublishError('');
    setPublishModalOpen(true);
  };

  const publishSelectedBatch = async (applyLunchWindow: boolean) => {
    if (!selectedBatchId) {
      return;
    }

    try {
      const result = await store.publishBatch(
        selectedBatchId,
        applyLunchWindow
          ? {
            startTime: lunchStartTime,
            endTime: lunchEndTime,
          }
          : undefined,
      );

      const batchLabel = selectedBatchLabel;
      setPublishModalOpen(false);
      setPublishError('');
      setSelectedBatchId('');
      setSelectedBatchLabel('');
      setStatusMessage(
        applyLunchWindow
          ? `Published ${batchLabel}: ${result.publishedCount} live, ${result.lunchExcludedCount} excluded for lunch.`
          : `Published ${batchLabel}: ${result.publishedCount} live.`,
      );
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Unable to publish batch');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <Card className="border-white/10 bg-[#101624]/95 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">Tutor Booking — Tutor View</p>
        <h2 className="mt-2 text-3xl font-black text-white">Slot Generator (Tutor)</h2>
        <p className="mt-3 text-sm text-white/65">Tutor interface — create draft slot batches, optionally on behalf of a lecturer, and publish them to students.</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Tutor name</Label>
            <Input value={tutorName} onChange={(event) => setTutorName(event.target.value)} className="border-white/10 bg-[#0d1320] text-white placeholder:text-white/35" />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Create slots for</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant={slotOwnerMode === 'self' ? 'default' : 'outline'} className="rounded-full" onClick={() => setSlotOwnerMode('self')}>
                Tutor self
              </Button>
              <Button type="button" variant={slotOwnerMode === 'lecturer' ? 'default' : 'outline'} className="rounded-full" onClick={() => setSlotOwnerMode('lecturer')}>
                Delegated lecturer
              </Button>
            </div>
          </div>

          {slotOwnerMode === 'lecturer' && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="space-y-2">
                <Label className="text-white">Lecturer name</Label>
                <Input value={lecturerName} onChange={(event) => setLecturerName(event.target.value)} className="border-white/10 bg-[#0d1320] text-white" placeholder="Lecturer full name" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Lecturer email</Label>
                <Input value={lecturerEmail} onChange={(event) => setLecturerEmail(event.target.value)} className="border-white/10 bg-[#0d1320] text-white" placeholder="lecturer@afda.co.za" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-white">Location mode</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant={locationMode === 'allocated' ? 'default' : 'outline'} className="rounded-full" onClick={() => setLocationMode('allocated')}>
                <MapPin className="mr-2 h-4 w-4" />
                Allocated Venues
              </Button>
              <Button type="button" variant={locationMode === 'custom' ? 'default' : 'outline'} className="rounded-full" onClick={() => setLocationMode('custom')}>
                <PencilLine className="mr-2 h-4 w-4" />
                Enter Custom Location
              </Button>
            </div>
          </div>

          {locationMode === 'allocated' ? (
            <div className="space-y-2">
              <Label className="text-white">Allocated venue</Label>
              <select value={venueId} onChange={(event) => setVenueId(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d1320] px-3 py-2 text-sm text-white outline-none">
                {store.venues.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.roomName} · {item.campus}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-white">Custom location</Label>
              <Input
                value={customLocation}
                onChange={(event) => setCustomLocation(event.target.value)}
                className="border-white/10 bg-[#0d1320] text-white"
                placeholder="My Office, Online, Studio A"
              />
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Dates</Label>
              <Textarea
                value={dateList}
                onChange={(event) => setDateList(event.target.value)}
                className="min-h-28 border-white/10 bg-[#0d1320] text-white"
                placeholder="2026-05-20\n2026-05-21"
              />
              <p className="text-xs text-white/55">Enter one date per line or separate multiple dates with commas.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Start time</Label>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="border-white/10 bg-[#0d1320] text-white" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-white">Duration (minutes)</Label>
              <Input type="number" min={5} step={5} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="border-white/10 bg-[#0d1320] text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Slot count</Label>
              <Input type="number" min={1} max={100} value={slotCount} onChange={(event) => setSlotCount(Number(event.target.value))} className="border-white/10 bg-[#0d1320] text-white" />
            </div>
          </div>

          <Button
            onClick={createSlots}
            disabled={!parsedDates.length || (locationMode === 'allocated' ? !venue : !customLocation.trim()) || (slotOwnerMode === 'lecturer' && (!lecturerName.trim() || !lecturerEmail.trim()))}
            className="w-full rounded-full bg-primary px-6 py-6 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <CalendarPlus2 className="mr-2 h-4 w-4" />
            Create Draft Slots for selected days
          </Button>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/60">
            <div className="flex items-center gap-2 text-white">
              <Lock className="h-4 w-4 text-primary" />
              {getLockoutCopy()}
            </div>
            {lockedDates.length > 0 && <p className="mt-2 text-xs text-amber-300">{lockedDates.length} selected day(s) are locked and will be skipped.</p>}
            <div className="mt-2 rounded-xl border border-white/10 bg-[#0d1320] p-3 text-xs text-white/60">
              {mounted
                ? (activeDelegations.length > 0
                  ? `You have ${activeDelegations.length} active delegation${activeDelegations.length === 1 ? '' : 's'} available.`
                  : 'No active lecturer delegations are assigned to this tutor yet.')
                : 'Checking delegation status...'}
            </div>
            {statusMessage && <p className="mt-2 text-emerald-300">{statusMessage}</p>}
          </div>
        </div>
      </Card>

      <Card className="border-white/10 bg-[#101624]/95 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Draft Batches</p>
            <h3 className="text-2xl font-black text-white">Publish to students</h3>
          </div>
          <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">{draftBatches.length} draft</Badge>
        </div>

        <ScrollArea className="mt-6 h-[520px] pr-3">
          <div className="space-y-3">
            {draftBatches.map((batch) => (
              <div key={batch.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{batch.locationLabel}</p>
                    <p className="text-xs text-white/60">
                      {batch.date} · {batch.startTime} · {batch.slotCount} slot{batch.slotCount === 1 ? '' : 's'}
                    </p>
                    <p className="mt-1 text-xs text-white/60">Tutor: {batch.tutorName}</p>
                  </div>
                  <Badge className="rounded-full bg-amber-500/20 text-amber-200 hover:bg-amber-500/20">Draft</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => openPublishModal(batch.id, batch.locationLabel)}
                  >
                    <Megaphone className="mr-2 h-4 w-4" />
                    Publish
                  </Button>
                </div>
              </div>
            ))}
            {!draftBatches.length && <p className="text-sm text-white/60">No draft batches yet.</p>}
          </div>
        </ScrollArea>
      </Card>

      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="border-white/10 bg-[#101624] text-white">
          <DialogHeader>
            <DialogTitle>Set Lunch Break</DialogTitle>
            <DialogDescription className="text-white/65">
              Configure a lunch window for {selectedBatchLabel || 'this batch'} before publishing slots to students.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-white">Lunch starts at</Label>
              <Input type="time" value={lunchStartTime} onChange={(event) => setLunchStartTime(event.target.value)} className="border-white/10 bg-[#0d1320] text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Lunch ends at</Label>
              <Input type="time" value={lunchEndTime} onChange={(event) => setLunchEndTime(event.target.value)} className="border-white/10 bg-[#0d1320] text-white" />
            </div>
            <p className="text-sm text-white/65">{lunchExclusionPreviewCount} slot(s) will be excluded from student booking during lunch.</p>
            {publishError && <p className="text-sm text-rose-300">{publishError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full border-white/20" onClick={() => publishSelectedBatch(false)}>
              Publish without lunch
            </Button>
            <Button type="button" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => publishSelectedBatch(true)}>
              Apply lunch and publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}