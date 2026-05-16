import type { Firestore } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';
import { WORKSUITE_DEV_MODE } from '@/worksuite/config';
import { worksuiteAuditsRef } from '@/worksuite/services/persistence';
import type { CalComBookingInput } from '@/lib/calcom';
import { normalizeCalComBookingResponse } from '@/lib/calcom';

export type CalendarServiceResult = {
  id: string;
  provider: 'mock' | 'cal.com' | 'microsoft-graph';
  tutorEmail: string;
  studentEmail: string;
  locationLabel: string;
  startTime: string;
  endTime: string;
  subject: string;
  summary: string;
  attendees: Array<{ email: string; role: 'organizer' | 'required' }>;
  createdAt: number;
  bookingUrl?: string | null;
  meetingUrl?: string | null;
};

function createCalendarEventId() {
  return `cal-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createCalendarBookingEvent(
  tutorEmail: string,
  studentName: string,
  studentEmail: string,
  locationLabel: string,
  startTime: string,
  endTime: string,
  db?: Firestore | null,
): Promise<CalendarServiceResult> {
  const graphEnabled = Boolean(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID);
  const calEnabled = String(process.env.NEXT_PUBLIC_CAL_ENABLED || 'false').toLowerCase() === 'true';

  if (graphEnabled) {
    const [date, start] = startTime.split(' ');
    const [, end] = endTime.split(' ');

    try {
      const response = await fetch('/api/graph/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorEmail,
          studentName,
          studentEmail,
          locationLabel,
          locationMode: /\bonline\b|teams|microsoft teams/i.test(locationLabel) ? 'custom' : 'allocated',
          date,
          startTime: start,
          endTime: end,
          timeZone: process.env.CAL_TIME_ZONE || 'Africa/Johannesburg',
        }),
      });

      if (response.ok) {
        const parsed = await response.json();
        const booking = parsed.booking ?? parsed;

        return {
          id: booking.uid,
          provider: booking.provider,
          tutorEmail,
          studentEmail,
          locationLabel,
          startTime,
          endTime,
          subject: booking.subject,
          summary: `Slot owner ${tutorEmail} and student ${studentEmail} at ${locationLabel}`,
          attendees: [
            { email: tutorEmail, role: 'organizer' },
            { email: studentEmail, role: 'required' },
          ],
          createdAt: Date.now(),
          bookingUrl: booking.bookingUrl,
          meetingUrl: booking.meetingUrl,
        };
      }

      if (response.status !== 503) {
        const errorText = await response.text();
        throw new Error(errorText || 'Microsoft Graph booking failed');
      }
    } catch (error) {
      console.warn('[calendarService] Microsoft Graph booking failed, falling back:', error);
    }
  }

  if (calEnabled) {
    const [date, start] = startTime.split(' ');
    const [, end] = endTime.split(' ');
    const payload: CalComBookingInput = {
      tutorEmail,
      studentName,
      studentEmail,
      locationLabel,
      locationMode: /\bonline\b|teams|microsoft teams/i.test(locationLabel) ? 'custom' : 'allocated',
      date,
      startTime: start,
      endTime: end,
      timeZone: process.env.CAL_TIME_ZONE || 'Africa/Johannesburg',
    };

    const response = await fetch('/api/calcom/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Cal.com booking failed');
    }

    const parsed = await response.json();
    const booking = normalizeCalComBookingResponse(parsed.booking ?? parsed);

    return {
      id: booking.uid,
      provider: booking.provider,
      tutorEmail,
      studentEmail,
      locationLabel,
      startTime,
      endTime,
      subject: booking.subject,
      summary: `Slot owner ${tutorEmail} and student ${studentEmail} at ${locationLabel}`,
      attendees: [
        { email: tutorEmail, role: 'organizer' },
        { email: studentEmail, role: 'required' },
      ],
      createdAt: Date.now(),
      bookingUrl: booking.bookingUrl,
      meetingUrl: booking.meetingUrl,
    };
  }

  const event: CalendarServiceResult = {
    id: createCalendarEventId(),
    provider: 'mock',
    tutorEmail,
    studentEmail,
    locationLabel,
    startTime,
    endTime,
    subject: `${locationLabel} booking`,
    summary: `Slot owner ${tutorEmail} and student ${studentEmail} at ${locationLabel}`,
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
      message: `Prepared calendar event for ${locationLabel}`,
      createdAt: Date.now(),
    });
  }

  return event;
}