'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFirestore } from '@/firebase';
import { CalendarService } from '../services/calendar-service';
import { buildVenueRecords, parseVenueSpreadsheet, autoMapVenueColumns } from '../services/spreadsheet';
import { mockWorksuiteSnapshot } from '../mock-data';
import { WORKSUITE_DEV_MODE } from '../config';
import {
  AuditRecord,
  BookingRecord,
  SlotRecord,
  SpreadsheetPreview,
  VenueColumnMapping,
  VenueRecord,
  WorksuiteSnapshot,
  WorksuiteUser,
} from '../types';
import { appendAuditEntry, loadWorksuiteSnapshot, saveWorksuiteSnapshot, syncSnapshotToFirestore } from '../services/persistence';

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

function ensureSnapshot(snapshot: WorksuiteSnapshot | null): WorksuiteSnapshot {
  return snapshot || structuredClone(mockWorksuiteSnapshot);
}

export function useWorksuiteStore(currentUser?: WorksuiteUser | null) {
  const db = useFirestore();
  const [snapshot, setSnapshot] = useState<WorksuiteSnapshot>(() => ensureSnapshot(loadWorksuiteSnapshot()));
  const [lastImport, setLastImport] = useState<SpreadsheetPreview | null>(null);
  const [lastMapping, setLastMapping] = useState<VenueColumnMapping | null>(null);

  useEffect(() => {
    saveWorksuiteSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (WORKSUITE_DEV_MODE || !db) {
      return;
    }

    void syncSnapshotToFirestore(db, snapshot).catch((error) => {
      console.warn('[Worksuite] Firestore sync skipped:', error);
    });
  }, [snapshot, db]);

  const venues = snapshot.venues;
  const slots = snapshot.slots;
  const bookings = snapshot.bookings;
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

    if (!WORKSUITE_DEV_MODE && db) {
      await syncSnapshotToFirestore(db, nextSnapshot);
    }

    return { imported: records.length };
  };

  const createSlots = async (payload: {
    venueId: string;
    tutorName: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    slotCount: number;
  }) => {
    const venue = snapshot.venues.find((item) => item.id === payload.venueId || item.venueId === payload.venueId);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const createdAt = Date.now();
    const generatedSlots: SlotRecord[] = [];

    for (let index = 0; index < payload.slotCount; index += 1) {
      const startHour = Number.parseInt(payload.startTime.split(':')[0] || '0', 10);
      const startMinute = Number.parseInt(payload.startTime.split(':')[1] || '0', 10) + index * payload.durationMinutes;
      const startDate = new Date(`${payload.date}T${payload.startTime}:00`);
      startDate.setMinutes(startDate.getMinutes() + index * payload.durationMinutes);
      const endDate = new Date(startDate.getTime() + payload.durationMinutes * 60_000);

      generatedSlots.push({
        id: createId('slot'),
        venueId: venue.id,
        venueName: venue.roomName,
        tutorName: payload.tutorName,
        date: payload.date,
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        durationMinutes: payload.durationMinutes,
        status: 'open',
        createdAt,
      });
    }

    const nextSnapshot: WorksuiteSnapshot = {
      ...snapshot,
      slots: [...generatedSlots, ...snapshot.slots],
      audits: [createAudit('slot-create', `Created ${generatedSlots.length} tutor slots for ${venue.roomName}`), ...snapshot.audits],
    };

    setSnapshot(nextSnapshot);
    saveWorksuiteSnapshot(nextSnapshot);

    if (!WORKSUITE_DEV_MODE && db) {
      await syncSnapshotToFirestore(db, nextSnapshot);
    }

    return generatedSlots;
  };

  const bookSlot = async (payload: {
    slotId: string;
    studentName: string;
    studentEmail: string;
    tutor: WorksuiteUser;
  }) => {
    const slot = snapshot.slots.find((entry) => entry.id === payload.slotId);
    if (!slot) {
      throw new Error('Slot not found');
    }

    if (snapshot.bookings.some((entry) => entry.studentEmail.toLowerCase() === payload.studentEmail.toLowerCase())) {
      throw new Error('This student already has a booking. One student may only claim one slot.');
    }

    if (slot.status === 'booked') {
      throw new Error('This slot is already booked.');
    }

    const booking: BookingRecord = {
      id: createId('booking'),
      slotId: slot.id,
      venueId: slot.venueId,
      venueName: slot.venueName,
      studentName: payload.studentName,
      studentEmail: payload.studentEmail,
      tutorName: slot.tutorName,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      bookedAt: Date.now(),
      calendarStatus: WORKSUITE_DEV_MODE ? 'mocked' : 'synced',
    };

    const nextSnapshot: WorksuiteSnapshot = {
      venues: snapshot.venues,
      slots: snapshot.slots.map((entry) => (entry.id === slot.id ? { ...entry, status: 'booked', bookedBy: payload.studentName, bookedByEmail: payload.studentEmail } : entry)),
      bookings: [booking, ...snapshot.bookings],
      audits: [createAudit('slot-book', `${payload.studentName} booked ${slot.venueName}`), ...snapshot.audits],
    };

    setSnapshot(nextSnapshot);
    saveWorksuiteSnapshot(nextSnapshot);

    const calendarService = new CalendarService(db);
    await calendarService.createBookingEvent({ slot, booking, tutor: payload.tutor });

    if (!WORKSUITE_DEV_MODE && db) {
      await syncSnapshotToFirestore(db, nextSnapshot);
    }

    return booking;
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
      openSlotCount: slots.filter((slot) => slot.status === 'open').length,
      lockedBookingCount: bookings.length,
    };
  }, [bookings.length, slots, venues.length]);

  return {
    venues,
    slots,
    bookings,
    audits,
    summary,
    lastImport,
    lastMapping,
    loadSpreadsheet,
    importVenues,
    createSlots,
    bookSlot,
    resetToSeed,
  };
}
