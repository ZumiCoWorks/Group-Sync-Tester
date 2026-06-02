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
    lunch_break_start?: string | null;
    lunch_break_end?: string | null;
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
  dayStartTime: string;
  dayEndTime: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://afda-api.vercel.app';
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
  dayStartTime: '09:00',
  dayEndTime: '17:00',
  lunchBreakStart: '13:00',
  lunchBreakEnd: '14:00',
});

const toDateInputValue = (value?: string | null) => (value ? value.slice(0, 10) : '');
const toTimeInputValue = (value?: string | null, fallback = '') => {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5);
  const parsed = new Date(`1970-01-01T${trimmed}`);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(11, 16);
  }
  return fallback;
};

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
          dayStartTime: '09:00',
          dayEndTime: '17:00',
          lunchBreakStart: toTimeInputValue(data.lunch_break_start, '13:00'),
          lunchBreakEnd: toTimeInputValue(data.lunch_break_end, '14:00'),
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

  // Generate fixed-duration slots across the date range while excluding the lunch window.
  function generateSlotsPayload(
    startDateStr: string,
    endDateStr: string,
    slotDurationMinutes: number,
    capacity: number,
    dayStart = '09:00',
    dayEnd = '17:00',
    lunchStart = '13:00',
    lunchEnd = '14:00'
  ) {
    if (slotDurationMinutes <= 0) return [];

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const days: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().slice(0, 10));
    }

    const parseMinutes = (time: string, fallback: number) => {
      const [hRaw, mRaw] = time.split(':');
      const h = Number(hRaw);
      const m = Number(mRaw);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
      return h * 60 + m;
    };

    const dayStartMinutes = parseMinutes(dayStart, 9 * 60);
    const dayEndMinutes = parseMinutes(dayEnd, 17 * 60);
    const lunchStartMinutes = parseMinutes(lunchStart, 13 * 60);
    const lunchEndMinutes = parseMinutes(lunchEnd, 14 * 60);

    const toUtcDate = (dateStr: string, minutesSinceMidnight: number) => {
      const hh = Math.floor(minutesSinceMidnight / 60).toString().padStart(2, '0');
      const mm = (minutesSinceMidnight % 60).toString().padStart(2, '0');
      return new Date(`${dateStr}T${hh}:${mm}:00.000Z`);
    };

    const windows: Array<{ start: Date; end: Date }> = [];
    for (const day of days) {
      const morningStart = toUtcDate(day, dayStartMinutes);
      const morningEnd = toUtcDate(day, Math.min(Math.max(lunchStartMinutes, dayStartMinutes), dayEndMinutes));
      if (morningEnd.getTime() > morningStart.getTime()) {
        windows.push({ start: morningStart, end: morningEnd });
      }

      const afternoonStart = toUtcDate(day, Math.min(Math.max(lunchEndMinutes, dayStartMinutes), dayEndMinutes));
      const afternoonEnd = toUtcDate(day, dayEndMinutes);
      if (afternoonEnd.getTime() > afternoonStart.getTime()) {
        windows.push({ start: afternoonStart, end: afternoonEnd });
      }
    }

    const generated: Array<{ start_time: string; end_time: string; capacity: number }> = [];
    const slotDurationMs = slotDurationMinutes * 60 * 1000;

    for (const window of windows) {
      let cursor = new Date(window.start);

      while (cursor.getTime() + slotDurationMs <= window.end.getTime()) {
        const slotEnd = new Date(cursor.getTime() + slotDurationMs);
        generated.push({
          start_time: cursor.toISOString(),
          end_time: slotEnd.toISOString(),
          capacity,
        });
        cursor = slotEnd;
      }
    }

    return generated;
  }

  // Real-time slot count calculator so you can verify before publishing
  const calculatedSlots = useMemo(() => {
    if (!formState.dateRangeStart || !formState.dateRangeEnd) return null;
    const totalSlotsInput = Number(formState.totalSlots) || 0;
    const slotDuration = Number(formState.slotDurationMinutes) || 0;
    if (totalSlotsInput <= 0 || slotDuration <= 0) return null;
    const slots = generateSlotsPayload(
      formState.dateRangeStart,
      formState.dateRangeEnd,
      slotDuration,
      1,
      formState.dayStartTime,
      formState.dayEndTime,
      formState.lunchBreakStart,
      formState.lunchBreakEnd
    );
    return slots.length;
  }, [formState.dateRangeStart, formState.dateRangeEnd, formState.totalSlots, formState.dayStartTime, formState.dayEndTime, formState.lunchBreakStart, formState.lunchBreakEnd]);

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
      const slotDuration = Number(formState.slotDurationMinutes) || 60;
      const perSlotCap = Number((document.getElementById('perSlotCapacity') as HTMLInputElement)?.value) || 1;
      const totalSlotsInput = Number(formState.totalSlots) || 0;
      const generatedSlots = totalSlotsInput > 0
        ? generateSlotsPayload(
            formState.dateRangeStart,
            formState.dateRangeEnd,
            slotDuration,
            perSlotCap,
            formState.dayStartTime,
            formState.dayEndTime,
            formState.lunchBreakStart,
            formState.lunchBreakEnd
          )
        : [];

      if (totalSlotsInput > 0 && generatedSlots.length !== totalSlotsInput) {
        setSaveError(
          `Requested ${totalSlotsInput} slots, but the selected hours only produce ${generatedSlots.length}. Adjust the day or lunch times before publishing.`
        );
        return;
      }

      const calculatedPlaceholderCapacity = generatedSlots.length * perSlotCap;

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
        ...(generatedSlots.length > 0 ? { slots: generatedSlots } : {}),
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
        if (response.status === 401) {
          setSaveError('Your session has expired. Please log in again.');
        } else {
          setSaveError(result.error?.message || 'Unable to save the batch.');
        }
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
        if (response.status === 401) {
          setSaveError('Your session has expired. Please log in again.');
        } else {
          setSaveError(result.error?.message || 'Unable to publish the batch.');
        }
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
        if (response.status === 401) {
          setSaveError('Your session has expired. Please log in again.');
        } else {
          setSaveError(result.error?.message || 'Unable to close the batch.');
        }
        return;
      }
      setSaveSuccess('Batch closed successfully. It is now available under Archived.');
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

        <section className="rounded-3xl border border-muted bg-white/85 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:bg-secondary/80">
          <div className="space-y-3">
            <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
              {isCreateMode ? 'New Batch' : 'Batch Setup'}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              {isCreateMode ? 'Set up a new batch.' : 'Edit batch details.'}
            </h1>
          </div>
          {batchId && (
            <div className="mt-5 rounded-2xl border border-accent-creative/20 bg-accent-creative/10 p-4 text-sm text-heading">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="font-semibold text-heading">Student booking link</p>
                  <p className="mt-1 break-all text-body">{bookingLink}</p>
                  <p className="mt-1 text-xs text-body">
                    {canSharePublicLinks
                      ? 'This is the link you can share with students.'
                      : 'Publish the batch before sharing this link with students.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/editor/${batchId}/bookings`)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-white/10"
                  >
                    Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(bookingLink, '_blank', 'noopener,noreferrer')}
                    disabled={!canSharePublicLinks}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
                  >
                    Open booking page
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyBookingLink()}
                    disabled={!canSharePublicLinks}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-white/10"
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

                <div className="rounded-2xl border border-muted bg-white p-4 shadow-sm dark:bg-white/5">
                  <p className="font-semibold text-heading">Lecturer roster link</p>
                  <p className="mt-1 break-all text-body">{lecturerRosterLink || 'Publish the batch to generate the lecturer roster link.'}</p>
                  <p className="mt-1 text-xs text-body">
                    Share this with a lecturer. They can view the booked student list without logging in.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => window.open(lecturerRosterLink, '_blank', 'noopener,noreferrer')}
                      disabled={!canSharePublicLinks || !lecturerRosterLink}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Open lecturer view
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyLecturerRosterLink()}
                      disabled={!canSharePublicLinks || !lecturerRosterLink}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copiedLecturerRosterLink ? 'Link copied' : 'Copy lecturer link'}
                    </button>
                  </div>
                </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-muted bg-white/85 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:bg-secondary/80">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-heading">Title</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={handleChange('title')}
                  className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none focus:border-accent-creative/60 dark:bg-secondary"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-heading">Description</label>
                <textarea
                  value={formState.description}
                  onChange={handleChange('description')}
                  rows={3}
                  className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none focus:border-accent-creative/60 dark:bg-secondary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Start Date</label>
                  <input
                    type="date"
                    value={formState.dateRangeStart}
                    onChange={handleChange('dateRangeStart')}
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none dark:bg-secondary"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">End Date</label>
                  <input
                    type="date"
                    value={formState.dateRangeEnd}
                    onChange={handleChange('dateRangeEnd')}
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none dark:bg-secondary"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-1">
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Slot Duration (mins)</label>
                  <input
                    type="number"
                    value={formState.slotDurationMinutes}
                    onChange={handleChange('slotDurationMinutes')}
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none dark:bg-secondary"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-muted bg-white p-4 text-sm text-body shadow-sm dark:bg-white/5">
                Each slot allows one booking only.
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Day Start Time</label>
                  <input
                    type="time"
                    value={formState.dayStartTime}
                    onChange={handleChange('dayStartTime')}
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none dark:bg-secondary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Day End Time</label>
                  <input
                    type="time"
                    value={formState.dayEndTime}
                    onChange={handleChange('dayEndTime')}
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none dark:bg-secondary"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Lunch Start</label>
                  <input
                    type="time"
                    value={formState.lunchBreakStart}
                    onChange={handleChange('lunchBreakStart')}
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none dark:bg-secondary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Lunch End</label>
                  <input
                    type="time"
                    value={formState.lunchBreakEnd}
                    onChange={handleChange('lunchBreakEnd')}
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none dark:bg-secondary"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Number of slots</label>
                  <input
                    type="number"
                    value={formState.totalSlots}
                    onChange={handleChange('totalSlots')}
                    min={0}
                    placeholder="Leave empty to use duration-based generation"
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none dark:bg-secondary"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-heading">Per-slot capacity</label>
                  <input
                    id="perSlotCapacity"
                    type="number"
                    defaultValue={1}
                    min={1}
                    className="block w-full rounded-2xl border border-muted bg-white px-4 py-3 text-heading outline-none dark:bg-secondary"
                  />
                </div>
              </div>

              {calculatedSlots !== null && (
                <div className="rounded-2xl border border-accent-creative/30 bg-accent-creative/10 p-4 text-sm text-heading">
                  <p className="font-semibold">Calculated Slot Count</p>
                  <p className="mt-2 text-2xl font-bold text-accent-creative">{calculatedSlots} slots</p>
                  <p className="mt-1 text-xs text-body">
                    {calculatedSlots === Number(formState.totalSlots)
                      ? '✓ Matches requested slots'
                      : `You requested ${formState.totalSlots} but your time settings produce ${calculatedSlots} slots`}
                  </p>
                </div>
              )}

              <p className="text-xs text-body">
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
                      className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
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