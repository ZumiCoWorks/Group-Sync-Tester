'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFirestore } from '@/firebase';
import { buildVenueRecords, parseVenueSpreadsheet, autoMapVenueColumns } from '../services/spreadsheet';
import { mockWorksuiteSnapshot } from '../mock-data';
import { WORKSUITE_DEV_MODE, isLocked } from '../config';
import {
  AuditRecord,
  BookingRecord,
  DelegationRecord,
  SlotBatch,
  SlotLocationMode,
  SlotRecord,
  SpreadsheetPreview,
  VenueColumnMapping,
  VenueRecord,
  WorksuiteSnapshot,
  WorksuiteUser,
} from '../types';
import { createCalendarBookingEvent } from '@/lib/calendarService';
import { doc, runTransaction, setDoc } from 'firebase/firestore';
import { canTutorActForLecturer } from '../authority';
import { loadWorksuiteSnapshot, saveWorksuiteSnapshot, syncSnapshotToFirestore, worksuiteAuditsRef, worksuiteBookingsRef, worksuiteRootRef, worksuiteSlotsRef } from '../services/persistence';

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`.toLowerCase();
}

function createAudit(action: string, message: string): AuditRecord {
  return {
    id: createId('audit'),
    action,
    message,
    createdAt: Date.now(),
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error('Invalid time value');
  }

  return hours * 60 + minutes;
}

function hasOverlap(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

function isPermissionDeniedError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeCode = 'code' in error ? String((error as { code?: unknown }).code || '') : '';
  const maybeMessage = 'message' in error ? String((error as { message?: unknown }).message || '') : '';

  return maybeCode.includes('permission-denied') || maybeMessage.includes('Missing or insufficient permissions');
}

function resolveAssignableRole(role: WorksuiteUser['role'] | undefined): Exclude<WorksuiteUser['role'], 'student'> {
  if (role === 'operations' || role === 'lecturer' || role === 'tutor') {
    return role;
  }

  return 'tutor';
}

function ensureSnapshot(snapshot: WorksuiteSnapshot | null): WorksuiteSnapshot {
  const seeded = snapshot || structuredClone(mockWorksuiteSnapshot);

  return {
    venues: seeded.venues || [],
    slotBatches: (seeded.slotBatches || []).map((batch) => ({
      ...batch,
      ownerName: batch.ownerName || batch.tutorName,
      ownerEmail: batch.ownerEmail || batch.tutorName,
      ownerRole: batch.ownerRole || 'tutor',
      createdBy: batch.createdBy || batch.tutorName,
      createdByRole: batch.createdByRole || 'tutor',
    })),
    slots: (seeded.slots || []).map((slot) => ({
      ...slot,
      batchId: slot.batchId || 'legacy-batch',
      locationLabel: slot.locationLabel || slot.venueName,
      locationMode: slot.locationMode || 'allocated',
      isPublished: typeof slot.isPublished === 'boolean' ? slot.isPublished : true,
      ownerName: slot.ownerName || slot.tutorName,
      ownerEmail: slot.ownerEmail || slot.tutorName,
      ownerRole: slot.ownerRole || 'tutor',
      createdBy: slot.createdBy || slot.tutorName,
      createdByRole: slot.createdByRole || 'tutor',
    })),
    bookings: (seeded.bookings || []).map((booking) => ({
      ...booking,
      locationLabel: booking.locationLabel || booking.venueName,
      locationMode: booking.locationMode || 'allocated',
      ownerName: booking.ownerName || booking.tutorName,
      ownerEmail: booking.ownerEmail || booking.tutorName,
      ownerRole: booking.ownerRole || 'tutor',
      createdBy: booking.createdBy || booking.tutorName,
      createdByRole: booking.createdByRole || 'tutor',
    })),
    delegations: (seeded.delegations || []).map((delegation) => ({
      ...delegation,
      isActive: typeof delegation.isActive === 'boolean' ? delegation.isActive : true,
      scope: delegation.scope || 'slot-create',
    })),
    audits: seeded.audits || [],
  };
}

export function useWorksuiteStore(currentUser?: WorksuiteUser | null) {
  const db = useFirestore();
  const [snapshot, setSnapshot] = useState<WorksuiteSnapshot>(() => ensureSnapshot(loadWorksuiteSnapshot()));
  const [lastImport, setLastImport] = useState<SpreadsheetPreview | null>(null);
  const [lastMapping, setLastMapping] = useState<VenueColumnMapping | null>(null);
  const syncDisabledRef = useRef(false);
  const syncSkipLoggedRef = useRef(false);

  const syncSnapshotSafely = async (nextSnapshot: WorksuiteSnapshot) => {
    if (WORKSUITE_DEV_MODE || !db || syncDisabledRef.current) {
      return;
    }

    try {
      await syncSnapshotToFirestore(db, nextSnapshot);
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        syncDisabledRef.current = true;

        if (!syncSkipLoggedRef.current) {
          console.info('[Worksuite] Firestore sync disabled for this session (permission denied). Using local snapshot only.');
          syncSkipLoggedRef.current = true;
        }
        return;
      }

      console.warn('[Worksuite] Firestore sync skipped:', error);
    }
  };

  useEffect(() => {
    saveWorksuiteSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    void syncSnapshotSafely(snapshot);
  }, [snapshot, db]);

  const venues = snapshot.venues;
  const slotBatches = snapshot.slotBatches;
  const slots = snapshot.slots;
  const bookings = snapshot.bookings;
  const delegations = snapshot.delegations;
  const audits = snapshot.audits;

  const loadSpreadsheet = async (file: File) => {
    const preview = await parseVenueSpreadsheet(file);
    setLastImport(preview);
    setLastMapping(autoMapVenueColumns(preview.headers));
    return preview;
  };

  const importVenues = async (mapping: VenueColumnMapping) => {
    if (!lastImport) {
      return { imported: 0 };
    }

    const records = buildVenueRecords(lastImport.rows, lastImport.headers, mapping);
    const merged = new Map<string, VenueRecord>();
    snapshot.venues.forEach((venue) => merged.set(venue.id, venue));
    records.forEach((venue) => merged.set(venue.id, venue));

    const nextSnapshot: WorksuiteSnapshot = {
      ...snapshot,
      venues: Array.from(merged.values()),
      audits: [createAudit('venue-import', `Imported ${records.length} venues from ${lastImport.sourceName}`), ...snapshot.audits],
    };

    setSnapshot(nextSnapshot);
    setLastMapping(mapping);
    saveWorksuiteSnapshot(nextSnapshot);

    await syncSnapshotSafely(nextSnapshot);

    return { imported: records.length };
  };

  const grantDelegation = async (payload: {
    lecturerName: string;
    lecturerEmail: string;
    tutorName: string;
    tutorEmail: string;
    scope?: DelegationRecord['scope'];
    note?: string;
    createdBy?: string;
  }) => {
    const record: DelegationRecord = {
      id: createId('delegation'),
      lecturerName: payload.lecturerName,
      lecturerEmail: payload.lecturerEmail.trim().toLowerCase(),
      tutorName: payload.tutorName,
      tutorEmail: payload.tutorEmail.trim().toLowerCase(),
      scope: payload.scope || 'slot-create',
      note: payload.note,
      createdBy: payload.createdBy || payload.lecturerName,
      createdAt: Date.now(),
      isActive: true,
    };

    const nextSnapshot: WorksuiteSnapshot = {
      ...snapshot,
      delegations: [record, ...snapshot.delegations],
      audits: [createAudit('delegation-grant', `Granted ${record.scope} access from ${record.lecturerName} to ${record.tutorName}`), ...snapshot.audits],
    };

    setSnapshot(nextSnapshot);
    saveWorksuiteSnapshot(nextSnapshot);

    await syncSnapshotSafely(nextSnapshot);

    return record;
  };

  const revokeDelegation = async (delegationId: string) => {
    const delegation = snapshot.delegations.find((entry) => entry.id === delegationId);
    if (!delegation) {
      throw new Error('Delegation not found');
    }

    const revokedAt = Date.now();
    const nextSnapshot: WorksuiteSnapshot = {
      ...snapshot,
      delegations: snapshot.delegations.map((entry) => (entry.id === delegationId ? { ...entry, isActive: false, revokedAt } : entry)),
      audits: [createAudit('delegation-revoke', `Revoked ${delegation.scope} access from ${delegation.tutorName}`), ...snapshot.audits],
    };

    setSnapshot(nextSnapshot);
    saveWorksuiteSnapshot(nextSnapshot);

    await syncSnapshotSafely(nextSnapshot);

    return delegationId;
  };

  const createSlots = async (payload: {
    locationMode: SlotLocationMode;
    venueId?: string;
    customLocation?: string;
    tutorName: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerRole?: Exclude<WorksuiteUser['role'], 'student'>;
    createdBy?: string;
    createdByRole?: Exclude<WorksuiteUser['role'], 'student'>;
    date: string;
    startTime: string;
    durationMinutes: number;
    slotCount: number;
  }) => {
    if (isLocked(payload.date)) {
      throw new Error('Schedule changes for the upcoming week are locked after Thursday 14:00.');
    }

    const venue = payload.locationMode === 'allocated'
      ? snapshot.venues.find((item) => item.id === payload.venueId || item.venueId === payload.venueId)
      : null;
    const customLocation = payload.customLocation?.trim() || '';
    const ownerEmail = (payload.ownerEmail || currentUser?.email || '').trim().toLowerCase();
    const ownerName = payload.ownerName?.trim() || payload.tutorName;
    const ownerRole = payload.ownerRole || resolveAssignableRole(currentUser?.role);
    const createdBy = payload.createdBy?.trim() || currentUser?.displayName || payload.tutorName;
    const createdByRole = payload.createdByRole || resolveAssignableRole(currentUser?.role);

    if (payload.locationMode === 'allocated' && !venue) {
      throw new Error('Venue not found');
    }

    if (payload.locationMode === 'custom' && !customLocation) {
      throw new Error('Enter a custom location before creating slots.');
    }

    if (ownerRole === 'lecturer' && currentUser?.role === 'tutor') {
      if (!ownerEmail) {
        throw new Error('Enter the lecturer email before creating delegated slots.');
      }

      if (!canTutorActForLecturer(snapshot.delegations, currentUser.email, ownerEmail)) {
        throw new Error('You do not have delegation rights to create slots for this lecturer.');
      }
    }

    const createdAt = Date.now();
    const batchId = createId('batch');
    const locationLabel = payload.locationMode === 'allocated'
      ? `${venue?.roomName || 'Allocated Venue'}${venue?.campus ? ` · ${venue.campus}` : ''}`
      : customLocation;
    const venueId = payload.locationMode === 'allocated' ? venue!.id : batchId;
    const venueName = payload.locationMode === 'allocated' ? venue!.roomName : customLocation;
    const generatedSlots: SlotRecord[] = [];

    for (let index = 0; index < payload.slotCount; index += 1) {
      const startDate = new Date(`${payload.date}T${payload.startTime}:00`);
      startDate.setMinutes(startDate.getMinutes() + index * payload.durationMinutes);
      const endDate = new Date(startDate.getTime() + payload.durationMinutes * 60_000);

      generatedSlots.push({
        id: createId('slot'),
        batchId,
        venueId,
        venueName,
        locationLabel,
        locationMode: payload.locationMode,
        ownerName,
        ownerEmail,
        ownerRole,
        createdBy,
        createdByRole,
        tutorName: payload.tutorName,
        date: payload.date,
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        durationMinutes: payload.durationMinutes,
        status: 'open',
        isPublished: ownerRole === 'lecturer',
        createdAt,
      });
    }

    const batch: SlotBatch = {
      id: batchId,
      tutorName: payload.tutorName,
      ownerName,
      ownerEmail,
      ownerRole,
      createdBy,
      createdByRole,
      date: payload.date,
      startTime: payload.startTime,
      durationMinutes: payload.durationMinutes,
      slotCount: payload.slotCount,
      locationMode: payload.locationMode,
      locationLabel,
      venueId,
      venueName,
      isPublished: ownerRole === 'lecturer',
      createdAt,
      ...(payload.locationMode === 'custom' ? { customLocation } : {}),
    };

    const nextSnapshot: WorksuiteSnapshot = {
      ...snapshot,
      slotBatches: [batch, ...snapshot.slotBatches],
      slots: [...generatedSlots, ...snapshot.slots],
      audits: [createAudit('slot-create', `Created ${generatedSlots.length} draft slots for ${locationLabel}`), ...snapshot.audits],
    };

    setSnapshot(nextSnapshot);
    saveWorksuiteSnapshot(nextSnapshot);

    await syncSnapshotSafely(nextSnapshot);

    return { batch, slots: generatedSlots };
  };

  const publishBatch = async (
    batchId: string,
    lunchWindow?: {
      startTime: string;
      endTime: string;
    },
  ) => {
    const batch = snapshot.slotBatches.find((entry) => entry.id === batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    let lunchStart = -1;
    let lunchEnd = -1;

    if (lunchWindow) {
      lunchStart = toMinutes(lunchWindow.startTime);
      lunchEnd = toMinutes(lunchWindow.endTime);

      if (lunchEnd <= lunchStart) {
        throw new Error('Lunch end time must be later than start time.');
      }
    }

    const publishedAt = Date.now();
    let publishedCount = 0;
    let lunchExcludedCount = 0;

    const nextSnapshot: WorksuiteSnapshot = {
      ...snapshot,
      slotBatches: snapshot.slotBatches.map((entry) => (entry.id === batchId ? { ...entry, isPublished: true, publishedAt } : entry)),
      slots: snapshot.slots.map((entry) => {
        if (entry.batchId !== batchId) {
          return entry;
        }

        if (!lunchWindow) {
          publishedCount += 1;
          return { ...entry, isPublished: true, publishedAt };
        }

        const slotStart = toMinutes(entry.startTime);
        const slotEnd = toMinutes(entry.endTime);
        const overlapsLunch = hasOverlap(slotStart, slotEnd, lunchStart, lunchEnd);

        if (overlapsLunch) {
          lunchExcludedCount += 1;
          return { ...entry, isPublished: false };
        }

        publishedCount += 1;
        return { ...entry, isPublished: true, publishedAt };
      }),
      audits: [
        createAudit(
          'slot-publish',
          lunchWindow
            ? `Published draft batch for ${batch.locationLabel}; ${publishedCount} slot(s) live, ${lunchExcludedCount} slot(s) excluded for lunch ${lunchWindow.startTime}-${lunchWindow.endTime}.`
            : `Published draft batch for ${batch.locationLabel}`,
        ),
        ...snapshot.audits,
      ],
    };

    setSnapshot(nextSnapshot);
    saveWorksuiteSnapshot(nextSnapshot);

    if (!WORKSUITE_DEV_MODE && db) {
      await syncSnapshotToFirestore(db, nextSnapshot);
    }

    return {
      batchId,
      publishedCount,
      lunchExcludedCount,
    };
  };

  const bookSlot = async (payload: {
    slotId: string;
    studentName: string;
    studentEmail: string;
    tutor: { email: string };
  }) => {
    const slot = snapshot.slots.find((entry) => entry.id === payload.slotId);
    if (!slot) {
      throw new Error('Slot not found');
    }

    if (!slot.isPublished) {
      throw new Error('This slot is still a draft and cannot be booked yet.');
    }

    const bookingId = normalizeEmail(payload.studentEmail);
    const auditRecord = createAudit('slot-book', `${payload.studentName} booked ${slot.locationLabel}`);
    const bookingRef = !WORKSUITE_DEV_MODE && db ? doc(worksuiteBookingsRef(db), bookingId) : null;
    const ownerEmail = slot.ownerEmail || payload.tutor.email;
    const ownerName = slot.ownerName || slot.tutorName;
    const ownerRole = slot.ownerRole || 'tutor';

    let booking: BookingRecord | null = null;

    if (!WORKSUITE_DEV_MODE && db && bookingRef) {
      const slotRef = doc(worksuiteSlotsRef(db), slot.id);

      await runTransaction(db, async (transaction) => {
        const slotSnapshot = await transaction.get(slotRef);
        if (!slotSnapshot.exists() || slotSnapshot.data().status === 'booked' || slotSnapshot.data().isPublished === false) {
          throw new Error('This slot was just taken.');
        }

        const bookingSnapshot = await transaction.get(bookingRef);
        if (bookingSnapshot.exists()) {
          throw new Error('This student already has a booking. One student may only claim one slot.');
        }

        booking = {
          id: bookingId,
          slotId: slot.id,
          venueId: slot.venueId,
          venueName: slot.venueName,
          locationLabel: slot.locationLabel,
          locationMode: slot.locationMode,
          ownerName,
          ownerEmail,
          ownerRole,
          createdBy: slot.createdBy,
          createdByRole: slot.createdByRole,
          studentName: payload.studentName,
          studentEmail: payload.studentEmail,
          tutorName: slot.tutorName,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          bookedAt: Date.now(),
          calendarStatus: 'synced',
        };

        transaction.set(slotRef, {
          ...slotSnapshot.data(),
          status: 'booked',
          bookedBy: payload.studentName,
          bookedByEmail: payload.studentEmail,
          bookingId,
          isPublished: true,
        });
        transaction.set(bookingRef, booking);
        transaction.set(doc(worksuiteAuditsRef(db), auditRecord.id), auditRecord);
        transaction.set(worksuiteRootRef(db), { updatedAt: Date.now(), namespace: 'ws_', module: 'worksuite' }, { merge: true });
      });
    } else {
      booking = {
        id: bookingId,
        slotId: slot.id,
        venueId: slot.venueId,
        venueName: slot.venueName,
        locationLabel: slot.locationLabel,
        locationMode: slot.locationMode,
          ownerName,
          ownerEmail,
          ownerRole,
          createdBy: slot.createdBy,
          createdByRole: slot.createdByRole,
        studentName: payload.studentName,
        studentEmail: payload.studentEmail,
        tutorName: slot.tutorName,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        bookedAt: Date.now(),
        calendarStatus: 'mocked',
      };
    }

    if (!booking) {
      throw new Error('Booking failed');
    }

    let calendarResult: Awaited<ReturnType<typeof createCalendarBookingEvent>> | null = null;
    try {
      calendarResult = await createCalendarBookingEvent(
        ownerEmail,
        payload.studentName,
        payload.studentEmail,
        slot.locationLabel,
        `${slot.date} ${slot.startTime}`,
        `${slot.date} ${slot.endTime}`,
        db,
      );
    } catch (error) {
      console.warn('[Worksuite] Calendar sync failed:', error);
    }

    const confirmedBooking: BookingRecord = {
      ...booking,
      calendarStatus: calendarResult?.provider && calendarResult.provider !== 'mock' ? 'synced' : 'mocked',
      calendarProvider: calendarResult?.provider ?? 'mock',
      calendarBookingUid: calendarResult?.id,
      calendarBookingUrl: calendarResult?.bookingUrl ?? null,
      calendarMeetingUrl: calendarResult?.meetingUrl ?? null,
    };

    if (!WORKSUITE_DEV_MODE && db && bookingRef) {
      await setDoc(bookingRef, confirmedBooking, { merge: true });
    }

    const nextSnapshot: WorksuiteSnapshot = {
      venues: snapshot.venues,
      slotBatches: snapshot.slotBatches,
      slots: snapshot.slots.map((entry) => (entry.id === slot.id ? { ...entry, status: 'booked', bookedBy: payload.studentName, bookedByEmail: payload.studentEmail, bookingId, isPublished: true } : entry)),
      bookings: [confirmedBooking, ...snapshot.bookings.filter((entry) => entry.id !== confirmedBooking.id)],
      delegations: snapshot.delegations,
      audits: [auditRecord, ...snapshot.audits],
    };

    setSnapshot(nextSnapshot);
    saveWorksuiteSnapshot(nextSnapshot);

    return confirmedBooking;
  };

  const resetToSeed = () => {
    setSnapshot(structuredClone(mockWorksuiteSnapshot));
    setLastImport(null);
    setLastMapping(null);
    saveWorksuiteSnapshot(structuredClone(mockWorksuiteSnapshot));
  };

  const summary = useMemo(() => {
    return {
      venueCount: venues.length,
      slotCount: slots.length,
      bookingCount: bookings.length,
      delegationCount: delegations.length,
      openSlotCount: slots.filter((slot) => slot.status === 'open' && slot.isPublished).length,
      lockedBookingCount: bookings.length,
    };
  }, [bookings.length, delegations.length, slots, venues.length]);

  return {
    venues,
    slotBatches,
    slots,
    bookings,
    delegations,
    audits,
    summary,
    lastImport,
    lastMapping,
    loadSpreadsheet,
    importVenues,
    grantDelegation,
    revokeDelegation,
    createSlots,
    publishBatch,
    bookSlot,
    resetToSeed,
  };
}
