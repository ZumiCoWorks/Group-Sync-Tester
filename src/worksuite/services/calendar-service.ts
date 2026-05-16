import { Firestore } from 'firebase/firestore';
import { createCalendarBookingEvent } from '@/lib/calendarService';
import { BookingRecord, SlotRecord, WorksuiteUser } from '../types';

export type CalendarServicePayload = {
  slot: SlotRecord;
  booking: BookingRecord;
  tutor: WorksuiteUser;
};

export class CalendarService {
  constructor(private readonly db: Firestore | null | undefined) {}

  async createBookingEvent(payload: CalendarServicePayload) {
    return createCalendarBookingEvent(
      payload.booking.ownerEmail || payload.slot.ownerEmail || payload.tutor.email,
      payload.booking.studentName,
      payload.booking.studentEmail,
      payload.slot.venueName,
      `${payload.slot.date} ${payload.slot.startTime}`,
      `${payload.slot.date} ${payload.slot.endTime}`,
      this.db,
    );
  }
}
