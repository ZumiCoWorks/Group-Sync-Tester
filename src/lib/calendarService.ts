import type { Firestore } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';
import { WORKSUITE_DEV_MODE } from '@/worksuite/config';
import { worksuiteAuditsRef } from '@/worksuite/services/persistence';

export type CalendarServiceResult = {
  id: string;
  provider: 'mock' | 'graph-ready';
  tutorEmail: string;
  studentEmail: string;
  venueName: string;
  startTime: string;
  endTime: string;
  subject: string;
  summary: string;
  attendees: Array<{ email: string; role: 'organizer' | 'required' }>;
  createdAt: number;
};

function createCalendarEventId() {
  return `cal-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createCalendarBookingEvent(
  tutorEmail: string,
  studentEmail: string,
  venueName: string,
  startTime: string,
  endTime: string,
  db?: Firestore | null,
): Promise<CalendarServiceResult> {
  const event: CalendarServiceResult = {
    id: createCalendarEventId(),
    provider: WORKSUITE_DEV_MODE ? 'mock' : 'graph-ready',
    tutorEmail,
    studentEmail,
    venueName,
    startTime,
    endTime,
    subject: `${venueName} booking`,
    summary: `Tutor ${tutorEmail} and student ${studentEmail} at ${venueName}`,
    attendees: [
      { email: tutorEmail, role: 'organizer' },
      { email: studentEmail, role: 'required' },
    ],
    createdAt: Date.now(),
  };

  if (db && !WORKSUITE_DEV_MODE) {
    await addDoc(worksuiteAuditsRef(db), {
      id: createCalendarEventId(),
      action: 'calendar-sync',
      message: `Prepared calendar event for ${venueName}`,
      createdAt: Date.now(),
    });
  }

  return event;
}