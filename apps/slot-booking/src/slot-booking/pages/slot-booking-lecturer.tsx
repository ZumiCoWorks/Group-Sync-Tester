'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarPlus2, Link2, ShieldCheck } from 'lucide-react';
import { listActiveDelegationsForLecturer, roleLabel } from '@/worksuite/authority';
import { cn } from '@/lib/utils';
import { useSlotBookingAuth } from '../auth/slot-booking-auth';
import { useSlotBookingStore } from '../store/use-slot-booking-store';

export function SlotBookingLecturerPage() {
  const { user } = useSlotBookingAuth();
  const store = useSlotBookingStore(user);
  const DISCIPLINES = [
    'Film',
    'Animation',
    'Production',
    'Design',
    'Other',
  ];
  const [mounted, setMounted] = useState(false);
  const [lecturerName, setLecturerName] = useState(user.displayName);
  const [lecturerEmail, setLecturerEmail] = useState(user.email);
  const [lecturerDiscipline, setLecturerDiscipline] = useState(DISCIPLINES[0]);
  const [locationMode, setLocationMode] = useState<'allocated' | 'custom'>('allocated');
  const [venueId, setVenueId] = useState(store.venues[0]?.id || '');
  const [customLocation, setCustomLocation] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [slotCount, setSlotCount] = useState(4);
  const [statusMessage, setStatusMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [delegateTutorName, setDelegateTutorName] = useState('');
  const [delegateTutorEmail, setDelegateTutorEmail] = useState('');
  const [delegateNote, setDelegateNote] = useState('');
  const [delegateScope, setDelegateScope] = useState<'slot-create' | 'calendar-sync' | 'full'>('slot-create');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedBatchLabel, setSelectedBatchLabel] = useState('');
  const [lunchStartTime, setLunchStartTime] = useState('12:30');
  const [lunchEndTime, setLunchEndTime] = useState('13:30');
  const [publishError, setPublishError] = useState('');

  const venue = store.venues.find((item) => item.id === venueId || item.venueId === venueId) || store.venues[0];
  const draftBatches = useMemo(() => store.slotBatches.filter((batch) => !batch.isPublished), [store.slotBatches]);
  const publishedBatches = useMemo(() => store.slotBatches.filter((batch) => batch.isPublished), [store.slotBatches]);
  const publishedSlots = useMemo(() => store.slots.filter((slot) => slot.isPublished), [store.slots]);
  const activeDelegations = useMemo(() => listActiveDelegationsForLecturer(store.delegations, user.email), [store.delegations, user.email]);
  const syncedBookings = useMemo(() => store.bookings.filter((booking) => booking.calendarStatus === 'synced'), [store.bookings]);
  const panelClass = 'border border-border bg-card p-5 text-card-foreground shadow-sm';
  const subPanelClass = 'rounded-2xl border border-border bg-muted/30 p-4';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!date) {
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [date]);

  const createSlots = async () => {
    const created = await store.createSlots({
      locationMode,
      venueId: venue?.id,
      customLocation,
      tutorName: lecturerName,
      ownerName: lecturerName,
      ownerEmail: lecturerEmail,
      ownerRole: 'lecturer',
      createdBy: user.displayName,
      createdByRole: 'lecturer',
      discipline: lecturerDiscipline,
      date,
      startTime,
      durationMinutes,
      slotCount,
    });

    setStatusMessage(`Created ${created.slots.length} lecturer slot${created.slots.length === 1 ? '' : 's'} for ${created.batch.locationLabel}.`);
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
      setShareUrl(`${window.location.origin}/public/${result.batchId}`);
      setStatusMessage(
        applyLunchWindow
          ? `Published ${batchLabel}: ${result.publishedCount} live, ${result.lunchExcludedCount} excluded for lunch.`
          : `Published ${batchLabel}: ${result.publishedCount} live.`,
      );
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Unable to publish batch');
    }
  };

  if (!mounted) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Lecturer lane</p>
          <h2 className="mt-1 text-2xl font-semibold">Lecturer dashboard</h2>
          <p className="mt-3 text-sm text-muted-foreground">Loading workspace data...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={cn(panelClass, 'lg:col-span-2')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Lecturer lane</p>
            <h2 className="mt-1 text-2xl font-semibold">Lecturer dashboard</h2>
            <p className="mt-2 text-sm text-muted-foreground">Create slots, publish, delegate, and monitor sync from one clean surface.</p>
          </div>
          <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600">{roleLabel(user.role)}</Badge>
        </div>
      </section>

      {/* Draft batches publish area (lecturer) - allow lecturers to publish their own batches to students */}
      <section className={panelClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Draft Batches</p>
            <h3 className="text-xl font-semibold">Publish to students</h3>
          </div>
          <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary" suppressHydrationWarning>
            {mounted ? `${draftBatches.length} draft` : '—'}
          </Badge>
        </div>

        <div className="mt-6">
          {draftBatches.map((batch) => (
            <div key={batch.id} className={cn('mb-3', subPanelClass)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{batch.locationLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {batch.date} · {batch.startTime} · {batch.slotCount} slot{batch.slotCount === 1 ? '' : 's'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Owner: {batch.ownerName} · {batch.ownerRole}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => openPublishModal(batch.id, batch.locationLabel)}
                  >
                    Publish
                  </Button>
                  {shareUrl && (
                    <div className="flex items-center gap-2 text-xs">
                      <a href={shareUrl} target="_blank" rel="noreferrer" className="font-medium text-primary underline">
                        Open share link
                      </a>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard?.writeText(shareUrl)}
                        className="rounded-full"
                      >
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!draftBatches.length && <p className="text-sm text-muted-foreground">No draft batches yet.</p>}
        </div>
      </section>

      <section className={panelClass}>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Slot creation</p>
        <h3 className="mt-1 text-xl font-semibold">Create lecturer slots</h3>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Lecturer name</Label>
            <Input value={lecturerName} onChange={(event) => setLecturerName(event.target.value)} className="border-border bg-background text-foreground" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Lecturer email</Label>
            <Input value={lecturerEmail} onChange={(event) => setLecturerEmail(event.target.value)} className="border-border bg-background text-foreground" />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Location mode</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button type="button" variant={locationMode === 'allocated' ? 'default' : 'outline'} className="rounded-full" onClick={() => setLocationMode('allocated')}>
                Allocated venue
              </Button>
              <Button type="button" variant={locationMode === 'custom' ? 'default' : 'outline'} className="rounded-full" onClick={() => setLocationMode('custom')}>
                Custom location
              </Button>
            </div>
          </div>

          {locationMode === 'allocated' ? (
            <div className="space-y-2">
              <Label className="text-foreground">Allocated venue</Label>
              <select value={venueId} onChange={(event) => setVenueId(event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none">
                {store.venues.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.roomName} · {item.campus}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-foreground">Custom location</Label>
              <Input value={customLocation} onChange={(event) => setCustomLocation(event.target.value)} className="border-border bg-background text-foreground" placeholder="Office, Studio A, Online" />
            </div>
          )}

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
              <Input type="number" min={1} max={100} value={slotCount} onChange={(event) => setSlotCount(Number(event.target.value))} className="border-border bg-background text-foreground" />
            </div>
          </div>

          <Button
            onClick={createSlots}
            disabled={locationMode === 'allocated'
              ? !venue || !date || !lecturerName.trim() || !lecturerEmail.trim()
              : !customLocation.trim() || !date || !lecturerName.trim() || !lecturerEmail.trim()}
            className="w-full rounded-full bg-primary px-6 py-6 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <CalendarPlus2 className="mr-2 h-4 w-4" />
            Create lecturer slots
          </Button>

          <div className={cn(subPanelClass, 'text-sm text-muted-foreground')}>
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Lecturer-owned slots are isolated from tutor workflows.
            </div>
            {statusMessage && <p className="mt-2 text-emerald-300">{statusMessage}</p>}
          </div>
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Delegation view</p>
            <h3 className="text-xl font-semibold">Tutor access grants</h3>
          </div>
          <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600" suppressHydrationWarning>
            {mounted ? `${activeDelegations.length} active` : '—'}
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          <div className={cn('space-y-2', subPanelClass)}>
            <Label className="text-foreground">Tutor name</Label>
            <Input value={delegateTutorName} onChange={(event) => setDelegateTutorName(event.target.value)} className="border-border bg-background text-foreground" placeholder="Tutor full name" />
            <Label className="text-foreground">Tutor email</Label>
            <Input value={delegateTutorEmail} onChange={(event) => setDelegateTutorEmail(event.target.value)} className="border-border bg-background text-foreground" placeholder="tutor@afda.co.za" />
            <Label className="text-foreground">Scope</Label>
            <select value={delegateScope} onChange={(event) => setDelegateScope(event.target.value as typeof delegateScope)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none">
              <option value="slot-create">Slot creation</option>
              <option value="calendar-sync">Calendar sync</option>
              <option value="full">Full</option>
            </select>
            <Label className="text-foreground">Note</Label>
            <Input value={delegateNote} onChange={(event) => setDelegateNote(event.target.value)} className="border-border bg-background text-foreground" placeholder="Reason for delegation" />
            <Button
              type="button"
              className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={async () => {
                await store.grantDelegation({
                  lecturerName: lecturerName || user.displayName,
                  lecturerEmail: lecturerEmail || user.email,
                  tutorName: delegateTutorName,
                  tutorEmail: delegateTutorEmail,
                  scope: delegateScope,
                  note: delegateNote,
                  createdBy: user.displayName,
                });
                setDelegateTutorName('');
                setDelegateTutorEmail('');
                setDelegateNote('');
                setStatusMessage(`Granted ${delegateScope} access to ${delegateTutorName}.`);
              }}
              disabled={!delegateTutorName.trim() || !delegateTutorEmail.trim()}
            >
              Grant delegation
            </Button>
          </div>

          <ScrollArea className="h-[250px] pr-3">
            <div className="space-y-3">
              {store.delegations.map((delegation) => (
                <div key={delegation.id} className={cn(subPanelClass, 'text-sm')}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">{delegation.tutorName}</p>
                      <p className="text-xs text-muted-foreground">{delegation.tutorEmail}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Scope: {delegation.scope}</p>
                    </div>
                    <Badge className={delegation.isActive ? 'rounded-full bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300' : 'rounded-full bg-muted text-muted-foreground hover:bg-muted'}>{delegation.isActive ? 'Active' : 'Revoked'}</Badge>
                  </div>
                  {delegation.note && <p className="mt-2 text-xs text-muted-foreground">{delegation.note}</p>}
                  {delegation.isActive && (
                    <Button type="button" variant="outline" size="sm" className="mt-3 rounded-full border-border" onClick={async () => store.revokeDelegation(delegation.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
              {!store.delegations.length && <p className="text-sm text-muted-foreground">No tutor delegations yet.</p>}
            </div>
          </ScrollArea>
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Calendar sync view</p>
            <h3 className="text-xl font-semibold">Microsoft sync status</h3>
          </div>
          <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600" suppressHydrationWarning>
            {mounted ? `${syncedBookings.length} synced` : '—'}
          </Badge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className={subPanelClass}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Bookings</p>
            <p className="mt-2 text-2xl font-bold" suppressHydrationWarning>{mounted ? store.bookings.length : '—'}</p>
          </div>
          <div className={subPanelClass}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Slots</p>
            <p className="mt-2 text-2xl font-bold" suppressHydrationWarning>{mounted ? store.summary.openSlotCount : '—'}</p>
          </div>
        </div>

        <ScrollArea className="mt-6 h-[300px] pr-3">
          <div className="space-y-3">
            {store.bookings.slice(0, 6).map((booking) => (
              <div key={booking.id} className={cn(subPanelClass, 'text-sm')}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{booking.locationLabel}</p>
                    <p className="text-xs text-muted-foreground">{booking.studentName} · {booking.startTime}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Owner: {booking.ownerName} · {booking.ownerRole}</p>
                  </div>
                  <Badge className={booking.calendarStatus === 'synced' ? 'rounded-full bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300' : 'rounded-full bg-amber-500/20 text-amber-800 hover:bg-amber-500/20 dark:text-amber-200'}>{booking.calendarStatus}</Badge>
                </div>
                {booking.calendarMeetingUrl && (
                  <a href={booking.calendarMeetingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                    <Link2 className="h-3.5 w-3.5" />
                    Open meeting link
                  </a>
                )}
              </div>
            ))}
            {!store.bookings.length && <p className="text-sm text-muted-foreground">No bookings synced yet.</p>}
          </div>
        </ScrollArea>
      </section>

      <section className={cn(panelClass, 'lg:col-span-2')}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Published Batches</p>
            <h3 className="text-xl font-semibold">Share links with students</h3>
          </div>
          <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600" suppressHydrationWarning>
            {mounted ? `${publishedBatches.length} live` : '—'}
          </Badge>
        </div>

        <div className="mt-6 space-y-3">
          {publishedBatches.map((batch) => {
            const publicPath = `/public/${batch.id}`;
            return (
              <div key={batch.id} className={subPanelClass}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                      <p className="font-bold">{batch.locationLabel}</p>
                      <p className="text-xs text-muted-foreground">
                      {batch.date} · {batch.startTime} · {batch.slotCount} slot{batch.slotCount === 1 ? '' : 's'}
                    </p>
                      <p className="mt-1 text-xs text-muted-foreground">Owner: {batch.ownerName} · {batch.ownerRole}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" className="rounded-full border-border" asChild>
                      <a href={publicPath} target="_blank" rel="noreferrer">Open</a>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-border"
                      onClick={async () => {
                        const absoluteUrl = `${window.location.origin}${publicPath}`;
                        try {
                          await navigator.clipboard.writeText(absoluteUrl);
                          setShareUrl(absoluteUrl);
                          setStatusMessage('Share link copied.');
                        } catch {
                          setShareUrl(absoluteUrl);
                          setStatusMessage('Share link ready to copy.');
                        }
                      }}
                    >
                      Copy link
                    </Button>
                  </div>
                </div>
                {shareUrl.endsWith(publicPath) && <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-300">{shareUrl}</p>}
              </div>
            );
          })}
          {!publishedBatches.length && <p className="text-sm text-muted-foreground">Published batches will appear here with a WhatsApp-ready link.</p>}
        </div>
      </section>

      <Dialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <DialogContent className="border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Set Lunch Break</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure a lunch window for {selectedBatchLabel || 'this batch'} before publishing slots to students.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-foreground">Lunch starts at</Label>
              <Input type="time" value={lunchStartTime} onChange={(event) => setLunchStartTime(event.target.value)} className="border-border bg-background text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Lunch ends at</Label>
              <Input type="time" value={lunchEndTime} onChange={(event) => setLunchEndTime(event.target.value)} className="border-border bg-background text-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{lunchExclusionPreviewCount} slot(s) will be excluded from student booking during lunch.</p>
            {publishError && <p className="text-sm text-rose-300">{publishError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-full" onClick={() => publishSelectedBatch(false)}>
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