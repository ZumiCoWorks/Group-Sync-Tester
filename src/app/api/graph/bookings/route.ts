import { NextRequest, NextResponse } from 'next/server';
import { getValidAzureAccessTokenForUser } from '@/lib/azure-token-store';

type GraphBookingRequest = {
  tutorEmail: string;
  studentName: string;
  studentEmail: string;
  locationLabel: string;
  locationMode?: string;
  date: string;
  startTime: string;
  endTime: string;
  timeZone?: string;
};

function buildIsoDateTime(date: string, time: string) {
  return `${date}T${time}:00`;
}

export async function POST(request: NextRequest) {
  const body = await request.json() as GraphBookingRequest;
  const ownerEmail = body.tutorEmail?.trim().toLowerCase();

  if (!ownerEmail) {
    return NextResponse.json({ error: 'Tutor email is required.' }, { status: 400 });
  }

  const accessToken = await getValidAzureAccessTokenForUser(ownerEmail);
  if (!accessToken) {
    return NextResponse.json(
      { error: `No Azure refresh token is available for ${ownerEmail}.` },
      { status: 503 },
    );
  }

  const timeZone = body.timeZone || 'Africa/Johannesburg';
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(ownerEmail)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: `outlook.timezone="${timeZone}"`,
    },
    body: JSON.stringify({
      subject: `${body.locationLabel} booking`,
      body: {
        contentType: 'text',
        content: `Student: ${body.studentName} (${body.studentEmail})\nLocation: ${body.locationLabel}`,
      },
      start: {
        dateTime: buildIsoDateTime(body.date, body.startTime),
        timeZone,
      },
      end: {
        dateTime: buildIsoDateTime(body.date, body.endTime),
        timeZone,
      },
      attendees: [
        {
          emailAddress: {
            address: body.studentEmail,
            name: body.studentName,
          },
          type: 'required',
        },
      ],
      location: {
        displayName: body.locationLabel,
      },
      isOnlineMeeting: /\bonline\b|teams|microsoft teams/i.test(body.locationLabel),
    }),
  });

  const responseText = await response.text();
  if (!response.ok) {
    return NextResponse.json(
      { error: `Microsoft Graph booking failed: ${responseText}` },
      { status: response.status },
    );
  }

  const parsed = responseText ? JSON.parse(responseText) as Record<string, unknown> : {};
  const onlineMeeting = parsed.onlineMeeting as { joinUrl?: unknown } | undefined;
  const start = parsed.start as { dateTime?: unknown } | undefined;
  const end = parsed.end as { dateTime?: unknown } | undefined;

  return NextResponse.json({
    booking: {
      provider: 'microsoft-graph',
      uid: String(parsed.id ?? crypto.randomUUID()),
      bookingUrl: typeof parsed.webLink === 'string' ? parsed.webLink : null,
      meetingUrl: typeof onlineMeeting?.joinUrl === 'string' ? onlineMeeting.joinUrl : null,
      start: typeof start?.dateTime === 'string' ? start.dateTime : '',
      end: typeof end?.dateTime === 'string' ? end.dateTime : '',
      subject: typeof parsed.subject === 'string' ? parsed.subject : `${body.locationLabel} booking`,
    },
  });
}