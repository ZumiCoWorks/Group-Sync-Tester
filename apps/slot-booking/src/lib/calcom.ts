import type { SlotLocationMode } from '@/worksuite/types';

export type CalComBookingInput = {
  tutorEmail: string;
  studentName: string;
  studentEmail: string;
  locationLabel: string;
  locationMode: SlotLocationMode;
  date: string;
  startTime: string;
  endTime: string;
  timeZone?: string;
};

export type CalComBookingResult = {
  provider: 'mock' | 'cal.com';
  uid: string;
  bookingUrl?: string | null;
  meetingUrl?: string | null;
  location?: unknown;
  start: string;
  end: string;
  subject: string;
};

function buildStartIso(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

function isOnlineVenue(locationLabel: string) {
  return /\bonline\b|teams|microsoft teams/i.test(locationLabel);
}

export function buildCalComBookingPayload(input: CalComBookingInput, eventTypeId: number) {
  const start = buildStartIso(input.date, input.startTime);
  const location = isOnlineVenue(input.locationLabel)
    ? { type: 'integration', integration: 'office365-video' as const }
    : { type: 'attendeeDefined', location: input.locationLabel };

  return {
    eventTypeId,
    start,
    attendee: {
      name: input.studentName,
      email: input.studentEmail,
      timeZone: input.timeZone || 'Africa/Johannesburg',
    },
    location,
    metadata: {
      source: 'group-sync-tester',
      tutorEmail: input.tutorEmail,
      locationLabel: input.locationLabel,
      locationMode: input.locationMode,
    },
  };
}

export function normalizeCalComBookingResponse(payload: any): CalComBookingResult {
  const data = payload?.data ?? payload;
  return {
    provider: 'cal.com',
    uid: String(data?.uid ?? data?.id ?? data?.bookingUid ?? crypto.randomUUID()),
    bookingUrl: data?.bookingUrl ?? data?.url ?? null,
    meetingUrl: data?.meetingUrl ?? data?.location?.link ?? null,
    location: data?.location ?? null,
    start: data?.start ?? '',
    end: data?.end ?? '',
    subject: data?.title ?? data?.eventType?.title ?? 'Booking',
  };
}
