import { Firestore } from 'firebase/firestore';
import { appendAuditEntry } from './persistence';
import { BookingRecord, SlotRecord, WorksuiteUser } from '../types';
import { WORKSUITE_DEV_MODE } from '../config';

export type CalendarServicePayload = {
  slot: SlotRecord;
  booking: BookingRecord;
  tutor: WorksuiteUser;
};

export class CalendarService {
  constructor(private readonly db: Firestore | null | undefined) {}

  async createBookingEvent(payload: CalendarServicePayload) {
    const event = {
      isOnlineMeeting: false,
      tutor: payload.tutor.displayName,
      venue: payload.slot.venueName,
      slotId: payload.slot.id,
      student: payload.booking.studentName,
      studentEmail: payload.booking.studentEmail,
      date: payload.slot.date,
      startTime: payload.slot.startTime,
      endTime: payload.slot.endTime,
      mode: WORKSUITE_DEV_MODE ? 'mock' : 'connected',
      createdAt: Date.now(),
    };

    console.log('[Worksuite CalendarService]', event);

    await appendAuditEntry(this.db, {
      id: `calendar-${payload.booking.id}`,
      action: 'calendar-event-created',
      message: `${payload.booking.studentName} booked ${payload.slot.venueName} with ${payload.tutor.displayName}`,
      createdAt: Date.now(),
    });

    return event;
  }
}
