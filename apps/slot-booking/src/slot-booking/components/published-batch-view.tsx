'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSlotBookingStore } from '../store/use-slot-booking-store';

export function PublishedBatchView({ batchId }: { batchId: string }) {
  const store = useSlotBookingStore();
  const [copyMessage, setCopyMessage] = useState('');

  const batch = useMemo(() => store.slotBatches.find((entry) => entry.id === batchId), [batchId, store.slotBatches]);
  const slots = useMemo(() => store.slots.filter((entry) => entry.batchId === batchId), [batchId, store.slots]);

  const counts = useMemo(() => ({
    booked: slots.filter((slot) => slot.status === 'booked').length,
    open: slots.filter((slot) => slot.status === 'open' && slot.isPublished).length,
    excluded: slots.filter((slot) => !slot.isPublished).length,
  }), [slots]);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/public/${batchId}` : '';

  if (!batch) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Published batch</p>
          <h2 className="mt-2 text-2xl font-black">Batch not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">This published view is unavailable or the batch has not been created yet.</p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/slot-booking">Back to booking hub</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyMessage('Student booking link copied.');
    } catch {
      setCopyMessage('Student booking link ready to copy.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_36%),linear-gradient(180deg,_#f8fafc,_#eff6ff)] py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 sm:px-6">
        <Card className="flex flex-col gap-4 border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AFDA Published Batch</p>
            <h2 className="mt-2 text-2xl font-black">{batch.locationLabel}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {batch.date} · {batch.startTime} · {batch.slotCount} slot{batch.slotCount === 1 ? '' : 's'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Discipline: {batch.discipline || 'Unspecified'} · Owner: {batch.ownerName}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">{counts.booked} booked</Badge>
            <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600">{counts.open} open</Badge>
            {counts.excluded > 0 && <Badge className="rounded-full bg-amber-500 px-3 py-1 text-white hover:bg-amber-500">{counts.excluded} lunch excluded</Badge>}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Published slots</p>
                <h3 className="text-xl font-semibold">Booked and empty slots</h3>
              </div>
              <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">{slots.length} total</Badge>
            </div>

            <ScrollArea className="mt-6 h-[60vh] pr-3">
              <div className="space-y-3">
                {slots.map((slot) => (
                  <div key={slot.id} className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{slot.date} · {slot.startTime} - {slot.endTime}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{slot.locationLabel}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Tutor: {slot.tutorName}</p>
                        {slot.bookedBy && <p className="mt-1 text-xs text-muted-foreground">Booked by: {slot.bookedBy}</p>}
                      </div>
                      <Badge
                        className={slot.status === 'booked'
                          ? 'rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600'
                          : slot.isPublished
                            ? 'rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600'
                            : 'rounded-full bg-amber-500 px-3 py-1 text-white hover:bg-amber-500'}
                      >
                        {slot.status === 'booked' ? 'Booked' : slot.isPublished ? 'Open' : 'Lunch excluded'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!slots.length && <p className="text-sm text-muted-foreground">No slots were found for this batch.</p>}
              </div>
            </ScrollArea>
          </Card>

          <Card className="border-border bg-card p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Share links</p>
            <h3 className="mt-1 text-xl font-semibold">Send the right link</h3>

            <div className="mt-4 space-y-3 rounded-2xl border border-border bg-muted/20 p-4 text-sm">
              <div>
                <p className="font-semibold">Student booking link</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">{shareUrl}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="rounded-full" onClick={copyShareLink}>Copy student link</Button>
                <Button asChild type="button" variant="outline" className="rounded-full">
                  <Link href={shareUrl || `/public/${batchId}`} target="_blank" rel="noreferrer">Open student page</Link>
                </Button>
              </div>
              {copyMessage && <p className="text-xs text-emerald-700">{copyMessage}</p>}
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              This page is for staff and shows the live state of each slot. The student link is separate and only shows bookable open slots.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}