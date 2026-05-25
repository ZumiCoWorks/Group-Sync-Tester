'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type EditorMode = 'create' | 'edit';

type BatchResponse = {
  success: boolean;
  data?: {
    id: string;
    title: string;
    description?: string | null;
    venue_id?: string | null;
    date_range_start: string;
    date_range_end: string;
    slot_duration_minutes: number;
    per_slot_capacity: number;
    batch_capacity?: number | null;
    status: string;
    booking_count?: number;
    total_slots?: number;
    published_at?: string | null;
    public_view_token?: string | null;
  };
  error?: { code: string; message: string; };
};

type BatchFormState = {
  title: string;
  description: string;
  venueId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  slotDurationMinutes: string;
  totalSlots: string;
  batchCapacity: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://afda-core-backend-bmi3qmvu5-zcw-nav-eaze.vercel.app';
const studentBookingBase = process.env.NEXT_PUBLIC_BATCH_LINK_BASE || 'https://student-public-zcw-nav-eaze.vercel.app';

const emptyFormState = (): BatchFormState => ({
  title: '',
  description: '',
  venueId: '',
  dateRangeStart: '',
  dateRangeEnd: '',
  slotDurationMinutes: '60',
  totalSlots: '',
  batchCapacity: '',
  lunchBreakStart: '13:00',
  lunchBreakEnd: '14:00',
});

const toDateInputValue = (value?: string | null) => (value ? value.slice(0, 10) : '');

export default function BatchEditorScreen({ mode, batchId, authToken }: { mode: EditorMode; batchId?: string; authToken: string }) {
  const router = useRouter();
  const isCreateMode = mode === 'create';

  const [loadingBatch, setLoadingBatch] = useState(!isCreateMode);
  const [batchError, setBatchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [copiedBookingLink, setCopiedBookingLink] = useState(false);
  const [copiedLecturerRosterLink, setCopiedLecturerRosterLink] = useState(false);
  const [formState, setFormState] = useState<BatchFormState>(emptyFormState());
  const [batchSummary, setBatchSummary] = useState<{
    status?: string;
    booking_count?: number;
    total_slots?: number;
    published_at?: string | null;
    public_view_token?: string | null;
  } | null>(null);

  useEffect(() => {
    const loadBatchDetails = async () => {
      if (!authToken || isCreateMode || !batchId) return;
      setLoadingBatch(true);
      setBatchError('');
      try {
        const response = await fetch(`${backendUrl}/api/batches/internal/${batchId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const payload = (await response.json()) as BatchResponse;

        if (!response.ok || !payload.success || !payload.data) {
          setBatchError(payload.error?.message || 'Unable to load batch details.');
          return;
        }

        const data = payload.data;
        setFormState({
          title: data.title || '',
          description: data.description || '',
          venueId: data.venue_id || '',
          dateRangeStart: toDateInputValue(data.date_range_start),
          dateRangeEnd: toDateInputValue(data.date_range_end),
          slotDurationMinutes: String(data.slot_duration_minutes ?? 60),
          totalSlots: data.total_slots ? String(data.total_slots) : '',
          batchCapacity: data.batch_capacity ? String(data.batch_capacity) : '',
          lunchBreakStart: '13:00',
          lunchBreakEnd: '14:00',
        });
        setBatchSummary({
          status: data.status,
          booking_count: data.booking_count,
          total_slots: data.total_slots,
          published_at: data.published_at,
          public_view_token: data.public_view_token,
        });
      } catch (error) {
        setBatchError('Unable to reach the backend.');
      } finally {
        setLoadingBatch(false);
      }
    };

    void loadBatchDetails();
  }, [authToken, batchId, isCreateMode]);

  const handleChange = (key: keyof BatchFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((current) => ({ ...current, [key]: event.target.value }));
  };

  // Generate N evenly spaced slots per day across the date range (skips lunch window)
  function generateSlotsPayload(startDateStr: string, endDateStr: string, totalSlots: number, capacity: number, lunchStart = '13:00', lunchEnd = '14:00') {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const days: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().slice(0, 10));
    }

    // For simplicity, distribute slots evenly across days
    const slotsPerDay = Math.max(1, Math.floor(totalSlots / days.length));
    const remainder = totalSlots - slotsPerDay * days.length;

    const generated: Array<{ start_time: string; end_time: string }> = [];

    const dayStart = (dateStr: string) => new Date(`${dateStr}T09:00:00.000Z`);
    const dayEnd = (dateStr: string) => new Date(`${dateStr}T17:00:00.000Z`);

    days.forEach((day, idx) => {
      const count = slotsPerDay + (idx < remainder ? 1 : 0);
      if (count <= 0) return;
      const start = dayStart(day);
      const end = dayEnd(day);
      const totalMs = end.getTime() - start.getTime();
      const slotMs = Math.floor(totalMs / count);

      for (let i = 0; i < count; i++) {
        const s = new Date(start.getTime() + i * slotMs);
        const e = new Date(s.getTime() + slotMs);
        // skip slots that fall into lunch
        const lunchStartMinutes = Number(lunchStart.split(':')[0]) * 60 + Number(lunchStart.split(':')[1]);
        const sMinutes = s.getHours() * 60 + s.getMinutes();
        if (sMinutes >= lunchStartMinutes && sMinutes < lunchStartMinutes + 60) continue;
        generated.push({ start_time: s.toISOString(), end_time: e.toISOString() });
      }
    });

    return generated.map((s) => ({ ...s, capacity }));
  }

  const bookingLink = batchId ? `${studentBookingBase}/batch/${batchId}` : '';
  const lecturerRosterLink = batchId && batchSummary?.public_view_token
    ? `${studentBookingBase}/batch/${batchId}/roster?token=${encodeURIComponent(batchSummary.public_view_token)}`
    : '';
  const canSharePublicLinks = batchSummary?.status === 'published';

  const copyBookingLink = async () => {
    if (!bookingLink) return;
    try {
      await navigator.clipboard.writeText(bookingLink);
      setCopiedBookingLink(true);
    } catch (error) {
      setSaveError('Unable to copy the booking link.');
    }
  };

  const copyLecturerRosterLink = async () => {
    if (!lecturerRosterLink) return;
    try {
      await navigator.clipboard.writeText(lecturerRosterLink);
      setCopiedLecturerRosterLink(true);
    } catch (error) {
      setSaveError('Unable to copy the lecturer roster link.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!formState.title.trim() || !formState.dateRangeStart || !formState.dateRangeEnd) {
      setSaveError('Title and date range are required.');
      return;
    }

    setSaving(true);
    try {
      // --- CALCULATION FALLBACK ---
      // Dynamically map a valid capacity configuration placeholder to satisfy PostgreSQL constraints
      const slotDuration = Number(formState.slotDurationMinutes) || 60;
      const perSlotCap = Number((document.getElementById('perSlotCapacity') as HTMLInputElement)?.value) || 1;
      const totalSlotsInput = Number(formState.totalSlots) || 0;
      // Default estimation assumes an operational 7-hour active daily window (420 minutes)
      const estimatedSlotsPerDay = Math.floor(420 / slotDuration) || 1;
      const calculatedPlaceholderCapacity = estimatedSlotsPerDay * perSlotCap;
      // ----------------------------

      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        venueId: formState.venueId.trim() || undefined,
        dateRangeStart: formState.dateRangeStart,
        dateRangeEnd: formState.dateRangeEnd,
        slotDurationMinutes: slotDuration,
        perSlotCapacity: perSlotCap,
        lunchBreakStart: formState.lunchBreakStart.trim() || undefined,
        lunchBreakEnd: formState.lunchBreakEnd.trim() || undefined,
        // FIX: Ensure 'null' is completely stripped to clear database constraints smoothly
        batchCapacity: formState.batchCapacity.trim() 
          ? Number(formState.batchCapacity) 
          : calculatedPlaceholderCapacity,
        // If user provided a totalSlots value, generate `slots` array client-side and send to backend
        ...(totalSlotsInput > 0 ? { slots: generateSlotsPayload(formState.dateRangeStart, formState.dateRangeEnd, totalSlotsInput, perSlotCap, formState.lunchBreakStart, formState.lunchBreakEnd) } : {}),
      };

      const response = await fetch(
        isCreateMode ? `${backendUrl}/api/batches` : `${backendUrl}/api/batches/${batchId}`,
        {
          method: isCreateMode ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      const result = (await response.json()) as BatchResponse;

      if (!response.ok || !result.success) {
        setSaveError(result.error?.message || 'Unable to save the batch.');
        return;
      }

      setSaveSuccess(isCreateMode ? 'Batch created successfully.' : 'Batch updated successfully.');
      setCopiedBookingLink(false);
      if (isCreateMode) router.push('/');
    } catch (error) {
      setSaveError('Unable to reach the backend.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!batchId) return;
    setPublishing(true);
    try {
      const response = await fetch(`${backendUrl}/api/batches/${batchId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const result = (await response.json()) as BatchResponse;
      if (!response.ok || !result.success) {
        setSaveError(result.error?.message || 'Unable to publish the batch.');
        return;
      }
      setSaveSuccess('Batch published successfully.');
      setBatchSummary((prev) => ({ ...prev, status: 'published' }));
    } catch (error) {
      setSaveError('Unable to reach the backend.');
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!batchId) return;

    const confirmed = window.confirm(
      'Close this batch? Students will no longer be able to make new bookings, but existing bookings will remain visible.'
    );
    if (!confirmed) return;

    setClosing(true);
    try {
      const response = await fetch(`${backendUrl}/api/batches/${batchId}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const result = (await response.json()) as BatchResponse;
      if (!response.ok || !result.success) {
        setSaveError(result.error?.message || 'Unable to close the batch.');
        return;
      }
      setSaveSuccess('Batch closed successfully.');
      setBatchSummary((prev) => ({ ...prev, status: 'closed' }));
    } catch (error) {
      setSaveError('Unable to reach the backend.');
    } finally {
      setClosing(false);
    }
  };

  if (loadingBatch) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-200">
        <p>Syncing batch details from dataset streams...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.08),_transparent_40%)]" />
      <div className="relative mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Back to dashboard
          </button>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
              {isCreateMode ? 'New Batch' : 'Batch Setup'}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              {isCreateMode ? 'Set up a new batch.' : 'Edit batch details.'}
            </h1>
          </div>
          {batchId && (
            <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-white">Student booking link</p>
                  <p className="mt-1 break-all text-cyan-100/90">{bookingLink}</p>
                  <p className="mt-1 text-xs text-cyan-100/70">
                    {canSharePublicLinks
                      ? 'This is the link you can share with students.'
                      : 'Publish the batch before sharing this link with students.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/editor/${batchId}/bookings`)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-white/10"
                  >
                    View bookings
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(bookingLink, '_blank', 'noopener,noreferrer')}
                    disabled={!canSharePublicLinks}
                    className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    Open booking page
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyBookingLink()}
                    disabled={!canSharePublicLinks}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-white/10"
                  >
                    {copiedBookingLink ? 'Link copied' : 'Copy link'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {batchError && <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-200">{batchError}</div>}
          {saveError && <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-200">{saveError}</div>}
          {saveSuccess && <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-200">{saveSuccess}</div>}

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="font-semibold text-white">Lecturer roster link</p>
                  <p className="mt-1 break-all text-cyan-100/90">{lecturerRosterLink || 'Publish the batch to generate the lecturer roster link.'}</p>
                  <p className="mt-1 text-xs text-cyan-100/70">
                    Share this with a lecturer. They can view the booked student list without logging in.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(lecturerRosterLink, '_blank', 'noopener,noreferrer')}
                      disabled={!canSharePublicLinks || !lecturerRosterLink}
                      className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Open lecturer view
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyLecturerRosterLink()}
                      disabled={!canSharePublicLinks || !lecturerRosterLink}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-cyan-50 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copiedLecturerRosterLink ? 'Link copied' : 'Copy lecturer link'}
                    </button>
                  </div>
                </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Title</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={handleChange('title')}
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-red-500/60"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
                <textarea
                  value={formState.description}
                  onChange={handleChange('description')}
                  rows={3}
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-red-500/60"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Start Date</label>
                  <input
                    type="date"
                    value={formState.dateRangeStart}
                    onChange={handleChange('dateRangeStart')}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">End Date</label>
                  <input
                    type="date"
                    value={formState.dateRangeEnd}
                    onChange={handleChange('dateRangeEnd')}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-1">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Slot Duration (mins)</label>
                  <input
                    type="number"
                    value={formState.slotDurationMinutes}
                    onChange={handleChange('slotDurationMinutes')}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Each slot allows one booking only.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Lunch Start</label>
                  <input
                    type="time"
                    value={formState.lunchBreakStart}
                    onChange={handleChange('lunchBreakStart')}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Lunch End</label>
                  <input
                    type="time"
                    value={formState.lunchBreakEnd}
                    onChange={handleChange('lunchBreakEnd')}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Number of slots</label>
                  <input
                    type="number"
                    value={formState.totalSlots}
                    onChange={handleChange('totalSlots')}
                    min={0}
                    placeholder="Leave empty to use duration-based generation"
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Per-slot capacity</label>
                  <input
                    id="perSlotCapacity"
                    type="number"
                    defaultValue={1}
                    min={1}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Any slot that would start during the lunch window will be skipped automatically.
              </p>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                    className="rounded-xl afda-brand-btn px-6 py-3 text-sm font-semibold hover:opacity-95 transition disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save batch'}
                </button>
                {!isCreateMode && batchSummary?.status === 'draft' && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing}
                      className="rounded-xl bg-afda-teal px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
                  >
                    {publishing ? 'Publishing…' : 'Publish and open bookings'}
                  </button>
                )}
                {!isCreateMode && batchSummary?.status === 'published' && (
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={closing}
                      className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
                  >
                    {closing ? 'Closing…' : 'Close bookings'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}