'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type EditorMode = 'create' | 'edit';

type StaffProfile = {
  email?: string;
  role?: string;
  name?: string;
};

type AuthVerifyResponse = {
  success: boolean;
  data?: {
    tokenPayload?: {
      email?: string;
      role?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
      [key: string]: unknown;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

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
    venue?: {
      id: string;
      name: string;
    } | null;
    slots?: Array<{
      id: string;
      start_time: string;
      end_time: string;
      capacity: number;
      booking_count: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
};

type BookingRecord = {
  id: string;
  slot_id: string;
  batch_id: string;
  student_name: string;
  student_email: string;
  student_id_external?: string | null;
  status: 'confirmed' | 'waitlisted' | 'cancelled' | 'attended';
  confirmation_number: string;
  booked_at: string;
  created_at: string;
  updated_at: string;
  marked_attended_at?: string | null;
  slot?: {
    id: string;
    start_time: string;
    end_time: string;
    capacity: number;
    booking_count: number;
  } | null;
};

type BookingListResponse = {
  success: boolean;
  data?: BookingRecord[];
  error?: {
    code: string;
    message: string;
  };
};

type ImportResponse = {
  success: boolean;
  data?: {
    jobId: string;
    batchId: string;
    totalRows: number;
    successCount: number;
    errorCount: number;
    status: 'completed' | 'failed';
    errors: Array<{
      rowNumber: number;
      first_name?: string;
      last_name?: string;
      email?: string;
      error: string;
    }>;
    errorReportCsv?: string;
  };
  error?: {
    code: string;
    message: string;
  };
};

type AuditLogRecord = {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any> | null;
  created_at: string;
};

type BatchFormState = {
  title: string;
  description: string;
  venueId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  slotDurationMinutes: string;
  perSlotCapacity: string;
  batchCapacity: string;
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'https://afda-api.vercel.app' : 'http://localhost:3001');
const AUTH_TOKEN_KEY = 'afda_slot_booking_token';

const emptyFormState = (): BatchFormState => ({
  title: '',
  description: '',
  venueId: '',
  dateRangeStart: '',
  dateRangeEnd: '',
  slotDurationMinutes: '60',
  perSlotCapacity: '1',
  batchCapacity: '',
});

const toDateInputValue = (value?: string | null) => (value ? value.slice(0, 10) : '');

const bookingStatusStyles: Record<BookingRecord['status'], string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/20',
  waitlisted: 'bg-amber-500/15 text-amber-200 ring-amber-400/20',
  cancelled: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
  attended: 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/20',
};

export default function BatchEditorScreen({ mode, batchId }: { mode: EditorMode; batchId?: string }) {
  const router = useRouter();
  const isCreateMode = mode === 'create';

  const [authToken, setAuthToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [profile, setProfile] = useState<StaffProfile | null>(null);

  const [loadingBatch, setLoadingBatch] = useState(!isCreateMode);
  const [batchError, setBatchError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [bookingActionKey, setBookingActionKey] = useState('');
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [importResult, setImportResult] = useState<ImportResponse['data'] | null>(null);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'xlsx' | 'csv' | null>(null);
  const [exportError, setExportError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [formState, setFormState] = useState<BatchFormState>(emptyFormState());
  const [batchSummary, setBatchSummary] = useState<{
    status?: string;
    booking_count?: number;
    total_slots?: number;
    published_at?: string | null;
  } | null>(null);

  const loadBatchDetails = async () => {
    if (!authToken || isCreateMode || !batchId) {
      return;
    }

    setLoadingBatch(true);
    setBatchError('');
    try {
      const response = await fetch(`${backendUrl}/api/batches/${batchId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
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
        perSlotCapacity: String(data.per_slot_capacity ?? 1),
        batchCapacity: data.batch_capacity === null || data.batch_capacity === undefined ? '' : String(data.batch_capacity),
      });
      setBatchSummary({
        status: data.status,
        booking_count: data.booking_count,
        total_slots: data.total_slots,
        published_at: data.published_at,
      });
    } catch (error) {
      setBatchError('Unable to reach the backend.');
    } finally {
      setLoadingBatch(false);
    }
  };

  const loadBookings = async () => {
    if (!authToken || isCreateMode || !batchId) {
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const response = await fetch(`${backendUrl}/api/bookings?batchId=${encodeURIComponent(batchId)}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const payload = (await response.json()) as BookingListResponse;

      if (!response.ok || !payload.success) {
        setBookingError(payload.error?.message || 'Unable to load bookings.');
        return;
      }

      setBookings(payload.data || []);
    } catch (error) {
      setBookingError('Unable to reach the backend.');
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (storedToken) {
      void verifyToken(storedToken);
    } else {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBatchDetails();
    void loadBookings();
  }, [authToken, batchId, isCreateMode]);

  const verifyToken = async (token: string) => {
    setAuthLoading(true);
    setAuthError('');

    try {
      const response = await fetch(`${backendUrl}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = (await response.json()) as AuthVerifyResponse;

      if (!response.ok || !payload.success) {
        setAuthToken('');
        setProfile(null);
        setAuthError(payload.error?.message || 'Invalid or expired staff token.');
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
        return;
      }

      const tokenPayload = payload.data?.tokenPayload || {};
      setAuthToken(token);
      setProfile({
        email: tokenPayload.email,
        role: tokenPayload.role,
        name: tokenPayload.name || [tokenPayload.given_name, tokenPayload.family_name].filter(Boolean).join(' '),
      });
      window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      setTokenInput('');
    } catch (error) {
      setAuthError('Unable to verify the token. Check your backend connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedToken = tokenInput.trim();

    if (!trimmedToken) {
      setAuthError('Paste a valid staff JWT token to continue.');
      return;
    }

    setAuthSubmitting(true);
    await verifyToken(trimmedToken);
    setAuthSubmitting(false);
  };

  const handleSignOut = () => {
    setAuthToken('');
    setProfile(null);
    setBatchSummary(null);
    setFormState(emptyFormState());
    setBookings([]);
    setBookingError('');
    setBookingLoading(false);
    setBookingActionKey('');
    setImportError('');
    setImportSuccess('');
    setImportResult(null);
    setExportError('');
    setCopySuccess('');
    setExportingFormat(null);
    setAuditLogs([]);
    setAuditError('');
    setAuditLoading(false);
    setAuditActionFilter('');
    setAuthError('');
    setSaveError('');
    setSaveSuccess('');
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    router.push('/');
  };

  const handleChange = (key: keyof BatchFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((current) => ({
      ...current,
      [key]: event.target.value,
    }));
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
      const payload = {
        title: formState.title.trim(),
        description: formState.description.trim() || undefined,
        venueId: formState.venueId.trim() || undefined,
        dateRangeStart: formState.dateRangeStart,
        dateRangeEnd: formState.dateRangeEnd,
        slotDurationMinutes: Number(formState.slotDurationMinutes),
        perSlotCapacity: Number(formState.perSlotCapacity),
        batchCapacity: formState.batchCapacity.trim() ? Number(formState.batchCapacity) : null,
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

      if (!response.ok || !result.success || !result.data) {
        setSaveError(result.error?.message || 'Unable to save the batch.');
        return;
      }

      setSaveSuccess(isCreateMode ? 'Batch created successfully.' : 'Batch updated successfully.');
      if (isCreateMode) {
        router.push('/');
      }
    } catch (error) {
      setSaveError('Unable to reach the backend.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveError('');
    setSaveSuccess('');

    if (!batchId) {
      setSaveError('Batch ID is missing.');
      return;
    }

    setPublishing(true);

    try {
      const response = await fetch(`${backendUrl}/api/batches/${batchId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const result = (await response.json()) as BatchResponse;

      if (!response.ok || !result.success || !result.data) {
        setSaveError(result.error?.message || 'Unable to publish the batch.');
        return;
      }

      setSaveSuccess('Batch published successfully. Students can now book slots.');
      setBatchSummary((prev) => ({
        ...prev,
        status: result.data?.status || 'published',
        published_at: result.data?.published_at,
      }));
    } catch (error) {
      setSaveError('Unable to reach the backend.');
    } finally {
      setPublishing(false);
    }
  };

  const refreshBatchAndBookings = async () => {
    await loadBatchDetails();
    await loadBookings();
  };

  const updateBookingStatus = async (bookingId: string, method: 'DELETE' | 'PUT', actionLabel: string) => {
    setSaveError('');
    setSaveSuccess('');
    setBookingError('');
    setBookingActionKey(`${bookingId}:${actionLabel}`);

    try {
      const response = await fetch(`${backendUrl}/api/bookings/${bookingId}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: method === 'PUT' ? JSON.stringify({ status: 'attended' }) : undefined,
      });

      const payload = (await response.json()) as { success: boolean; error?: { message?: string } };

      if (!response.ok || !payload.success) {
        setBookingError(payload.error?.message || `Unable to ${actionLabel} booking.`);
        return;
      }

      setSaveSuccess(`Booking ${actionLabel} successfully.`);
      await refreshBatchAndBookings();
    } catch (error) {
      setBookingError('Unable to reach the backend.');
    } finally {
      setBookingActionKey('');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'DELETE', 'cancelled');
  };

  const handleMarkAttended = async (bookingId: string) => {
    await updateBookingStatus(bookingId, 'PUT', 'marked attended');
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedImportFile(file);
    setImportError('');
    setImportSuccess('');
    setImportResult(null);
  };

  const handleImportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setImportError('');
    setImportSuccess('');

    if (!batchId) {
      setImportError('Batch ID is missing.');
      return;
    }

    if (!selectedImportFile) {
      setImportError('Choose an .xlsx file to upload.');
      return;
    }

    setImporting(true);

    try {
      const formData = new FormData();
      formData.append('batchId', batchId);
      formData.append('file', selectedImportFile);

      const response = await fetch(`${backendUrl}/api/imports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const payload = (await response.json()) as ImportResponse;

      if (!response.ok || !payload.success || !payload.data) {
        setImportError(payload.error?.message || 'Unable to import participants.');
        return;
      }

      setImportResult(payload.data);
      setImportSuccess(
        payload.data.errorCount > 0
          ? `Imported ${payload.data.successCount} participants with ${payload.data.errorCount} validation issues.`
          : `Imported ${payload.data.successCount} participants successfully.`
      );
      setSelectedImportFile(null);
      await refreshBatchAndBookings();
    } catch (error) {
      setImportError('Unable to reach the backend.');
    } finally {
      setImporting(false);
    }
  };

  const downloadImportErrors = () => {
    if (!importResult?.errorReportCsv) {
      return;
    }

    const blob = new Blob([importResult.errorReportCsv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `import-errors-${importResult.jobId}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const attendeeCopyText = useMemo(() => {
    const rows = bookings
      .filter((booking) => booking.status !== 'cancelled')
      .map((booking) => `${booking.student_name} <${booking.student_email}>`);

    return rows.join('\n');
  }, [bookings]);

  const exportFileBase = useMemo(() => {
    const slugSource = formState.title || batchId || 'batch';
    return slugSource.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }, [batchId, formState.title]);

  const downloadExport = async (format: 'pdf' | 'xlsx' | 'csv') => {
    if (!batchId) {
      setExportError('Batch ID is missing.');
      return;
    }

    setExportError('');
    setCopySuccess('');
    setExportingFormat(format);

    try {
      const response = await fetch(`${backendUrl}/api/exports?batchId=${encodeURIComponent(batchId)}&format=${format}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: { message?: string } };
        setExportError(payload.error?.message || `Unable to export ${format.toUpperCase()}.`);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${exportFileBase}-bookings.${format}`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setExportError('Unable to reach the backend.');
    } finally {
      setExportingFormat(null);
    }
  };

  const copyAttendeeList = async () => {
    setCopySuccess('');
    setExportError('');

    try {
      await navigator.clipboard.writeText(attendeeCopyText || '');
      setCopySuccess(attendeeCopyText ? 'Attendee list copied to clipboard.' : 'No bookings available to copy.');
    } catch (error) {
      setExportError('Unable to copy attendee list to clipboard.');
    }
  };

  const loadAuditLogs = async () => {
    if (!authToken || !batchId) {
      return;
    }

    setAuditLoading(true);
    setAuditError('');

    try {
      const query = new URLSearchParams({ batchId });
      if (auditActionFilter) {
        query.append('action', auditActionFilter);
      }

      const response = await fetch(`http://localhost:3001/api/audit-logs?${query.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch audit logs');
      }

      const result = await response.json();
      setAuditLogs(result.data || []);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : 'Failed to fetch audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  const downloadAuditLogsCSV = async () => {
    if (!authToken || !batchId) {
      return;
    }

    try {
      const query = new URLSearchParams({ batchId });
      if (auditActionFilter) {
        query.append('action', auditActionFilter);
      }

      const response = await fetch(`http://localhost:3001/api/audit-logs/export?${query.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download audit logs');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : 'Failed to download audit logs');
    }
  };

  const isBusy = authLoading || loadingBatch;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-slate-200">
        <p className="text-lg">Checking staff access…</p>
      </div>
    );
  }

  if (!authToken) {
    return (
      <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_32%)]" />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
          <section className="w-full rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                Staff access
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Sign in to edit batch details.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Paste a valid JWT from your auth provider so the editor can load and save batch data.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="staff-token" className="mb-2 block text-sm font-medium text-slate-200">
                  Staff token
                </label>
                <textarea
                  id="staff-token"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="Paste JWT here"
                  className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />
              </div>

              {authError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {authSubmitting ? 'Verifying token…' : 'Sign in'}
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.10),_transparent_32%)]" />

      <div className="relative mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-400/15"
          >
            Sign out
          </button>
        </div>

        <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                {isCreateMode ? 'New batch' : 'Edit batch'}
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {isCreateMode ? 'Create a batch draft.' : 'Edit the batch configuration.'}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Update the core batch metadata, capacity, and date range. Slots can be generated by the backend flow that comes next.
              </p>
              <p className="text-sm text-slate-400">
                Signed in as <span className="font-medium text-slate-200">{profile?.email || 'staff user'}</span>
                {profile?.role ? <span className="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">{profile.role}</span> : null}
              </p>
            </div>

            {batchSummary && !isCreateMode && (
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Status', value: batchSummary.status || 'draft' },
                  { label: 'Slots', value: batchSummary.total_slots ?? 0 },
                  { label: 'Bookings', value: batchSummary.booking_count ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{String(item.value).split('_').join(' ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {batchError && (
            <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {batchError}
            </div>
          )}
          {saveError && (
            <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {saveSuccess}
            </div>
          )}
        </section>

        {!isCreateMode && (
          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Booking management</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Review attendees, cancel bookings, or mark students as attended for this batch.
                </p>
              </div>
              <div className="text-sm text-slate-400">
                {bookings.length} booking{bookings.length === 1 ? '' : 's'} loaded
              </div>
            </div>

            {bookingError && (
              <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {bookingError}
              </div>
            )}

            {bookingLoading ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                Loading bookings…
              </div>
            ) : bookings.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                No bookings have been created for this batch yet.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {bookings.map((booking) => {
                  const canceling = bookingActionKey === `${booking.id}:cancelled`;
                  const attending = bookingActionKey === `${booking.id}:marked attended`;
                  const slotLabel = booking.slot
                    ? `${new Date(booking.slot.start_time).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })} - ${new Date(booking.slot.end_time).toLocaleTimeString([], { timeStyle: 'short' })}`
                    : 'Slot unavailable';

                  return (
                    <article key={booking.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold text-white">{booking.student_name}</h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ring-1 ${bookingStatusStyles[booking.status]}`}>
                              {booking.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                            <span>
                              Email: <strong className="text-white">{booking.student_email}</strong>
                            </span>
                            <span>
                              Confirmation: <strong className="text-white">{booking.confirmation_number}</strong>
                            </span>
                            <span>
                              Booked: <strong className="text-white">{new Date(booking.booked_at).toLocaleString()}</strong>
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                            <span>
                              Slot: <strong className="text-slate-200">{slotLabel}</strong>
                            </span>
                            {booking.student_id_external ? (
                              <span>
                                External ID: <strong className="text-slate-200">{booking.student_id_external}</strong>
                              </span>
                            ) : null}
                            {booking.marked_attended_at ? (
                              <span>
                                Attended: <strong className="text-slate-200">{new Date(booking.marked_attended_at).toLocaleString()}</strong>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 lg:flex-col lg:items-stretch">
                          {booking.status !== 'cancelled' && booking.status !== 'attended' && (
                            <button
                              type="button"
                              onClick={() => void handleCancelBooking(booking.id)}
                              disabled={canceling || attending}
                              className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {canceling ? 'Cancelling…' : 'Cancel'}
                            </button>
                          )}

                          {booking.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => void handleMarkAttended(booking.id)}
                              disabled={canceling || attending}
                              className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {attending ? 'Saving…' : 'Mark attended'}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {!isCreateMode && (
          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">XLSX import</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Upload a roster with <span className="font-medium text-white">first_name</span>,
                  <span className="font-medium text-white"> last_name</span>, and
                  <span className="font-medium text-white"> email</span> columns.
                </p>
              </div>
              <div className="text-sm text-slate-400">
                Imports are matched to the batch&apos;s available slots.
              </div>
            </div>

            <form onSubmit={handleImportSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">XLSX file</label>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleImportFileChange}
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-cyan-300"
                />
              </div>

              {importError && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  <div>{importSuccess}</div>
                  {importResult?.errorCount ? (
                    <button
                      type="button"
                      onClick={downloadImportErrors}
                      className="mt-3 inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Download error report
                    </button>
                  ) : null}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={importing}
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {importing ? 'Importing…' : 'Import participants'}
                </button>
                {selectedImportFile ? (
                  <span className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    {selectedImportFile.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-400">
                    No file selected
                  </span>
                )}
              </div>
            </form>
          </section>
        )}

        {!isCreateMode && (
          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Exports and clipboard</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Download printable PDFs, spreadsheet-ready XLSX files, or copy an attendee list for email.
                </p>
              </div>
              <div className="text-sm text-slate-400">
                Exports use the current batch and loaded bookings.
              </div>
            </div>

            {exportError && (
              <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {exportError}
              </div>
            )}

            {copySuccess && (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {copySuccess}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => void downloadExport('pdf')}
                disabled={exportingFormat === 'pdf'}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exportingFormat === 'pdf' ? 'Generating PDF…' : 'Download PDF'}
              </button>
              <button
                type="button"
                onClick={() => void downloadExport('xlsx')}
                disabled={exportingFormat === 'xlsx'}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exportingFormat === 'xlsx' ? 'Generating XLSX…' : 'Download XLSX'}
              </button>
              <button
                type="button"
                onClick={() => void downloadExport('csv')}
                disabled={exportingFormat === 'csv'}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exportingFormat === 'csv' ? 'Generating CSV…' : 'Download CSV'}
              </button>
              <button
                type="button"
                onClick={() => void copyAttendeeList()}
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Copy attendee list
              </button>
            </div>
          </section>
        )}

        {!isCreateMode && (
          <section className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Audit logs</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Track all actions performed on this batch including bookings, imports, and exports.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadAuditLogs()}
                disabled={auditLoading}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {auditLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>

            {auditError && (
              <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {auditError}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <select
                value={auditActionFilter}
                onChange={(e) => {
                  setAuditActionFilter(e.target.value);
                  setAuditLogs([]);
                }}
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
              >
                <option value="">All actions</option>
                <option value="batch_created">Batch Created</option>
                <option value="batch_edited">Batch Edited</option>
                <option value="batch_published">Batch Published</option>
                <option value="booking_confirmed">Booking Confirmed</option>
                <option value="booking_cancelled">Booking Cancelled</option>
                <option value="booking_marked_attended">Booking Attended</option>
              </select>

              <button
                type="button"
                onClick={() => void downloadAuditLogsCSV()}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Download as CSV
              </button>
            </div>

            {auditLogs.length > 0 ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Timestamp</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Action</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-300">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-cyan-200">
                          <span className="inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {log.details ? JSON.stringify(log.details).substring(0, 100) + '...' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-400">
                {auditLogs.length === 0 && !auditLoading ? 'No audit logs found. Click Refresh to load.' : ''}
              </div>
            )}
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">Batch details</h2>
                <p className="mt-2 text-sm text-slate-300">Keep the fields accurate so bookings stay aligned with the schedule.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-200">Title</label>
                  <input
                    type="text"
                    value={formState.title}
                    onChange={handleChange('title')}
                    placeholder="Orientation Session"
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
                  <textarea
                    value={formState.description}
                    onChange={handleChange('description')}
                    rows={4}
                    placeholder="Short description shown on the dashboard and booking pages."
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Venue ID</label>
                  <input
                    type="text"
                    value={formState.venueId}
                    onChange={handleChange('venueId')}
                    placeholder="Optional"
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Slot duration (mins)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formState.slotDurationMinutes}
                    onChange={handleChange('slotDurationMinutes')}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Start date</label>
                  <input
                    type="date"
                    value={formState.dateRangeStart}
                    onChange={handleChange('dateRangeStart')}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">End date</label>
                  <input
                    type="date"
                    value={formState.dateRangeEnd}
                    onChange={handleChange('dateRangeEnd')}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Per-slot capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.perSlotCapacity}
                    onChange={handleChange('perSlotCapacity')}
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Batch capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.batchCapacity}
                    onChange={handleChange('batchCapacity')}
                    placeholder="Optional"
                    className="block w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving || isBusy}
                  className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-500"
                >
                  {saving ? 'Saving…' : isCreateMode ? 'Create batch' : 'Save changes'}
                </button>

                {!isCreateMode && batchSummary?.status === 'draft' && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing || isBusy}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-500"
                  >
                    {publishing ? 'Publishing…' : 'Publish batch'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold text-white">What this controls</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-300">
                <li>• Batch title and description shown to staff and students.</li>
                <li>• The date range used when generating slots.</li>
                <li>• Capacity rules for each slot and the overall batch.</li>
                <li>• Optional venue assignment for planning.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
              <h2 className="text-2xl font-semibold text-white">Next workflow step</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Once the form is saved, the next todo item is the publish workflow so batches can be moved from draft into public booking.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
