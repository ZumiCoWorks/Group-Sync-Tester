import { NextRequest, NextResponse } from 'next/server';
import { buildCalComBookingPayload, normalizeCalComBookingResponse } from '@/lib/calcom';

const CAL_API_BASE_URL = process.env.CAL_API_BASE_URL || 'https://api.cal.com';
const CAL_API_VERSION = process.env.CAL_API_VERSION || '2026-02-25';
const CAL_API_KEY = process.env.CAL_API_KEY || '';
const CAL_EVENT_TYPE_ID = Number(process.env.CAL_EVENT_TYPE_ID || '0');
const CAL_ENABLED = String(process.env.NEXT_PUBLIC_CAL_ENABLED || 'false').toLowerCase() === 'true';

export async function POST(request: NextRequest) {
  if (!CAL_ENABLED) {
    return NextResponse.json({ error: 'Cal.com integration is disabled.' }, { status: 503 });
  }

  if (!CAL_API_KEY || !CAL_EVENT_TYPE_ID) {
    return NextResponse.json(
      { error: 'Cal.com API key and event type id are required.' },
      { status: 503 },
    );
  }

  const body = await request.json();
  const payload = buildCalComBookingPayload(body, CAL_EVENT_TYPE_ID);

  const response = await fetch(`${CAL_API_BASE_URL}/v2/bookings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CAL_API_KEY}`,
      'Content-Type': 'application/json',
      'cal-api-version': CAL_API_VERSION,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  if (!response.ok) {
    return NextResponse.json(
      { error: `Cal.com booking failed: ${responseText}` },
      { status: response.status },
    );
  }

  const parsed = responseText ? JSON.parse(responseText) : {};
  return NextResponse.json({ booking: normalizeCalComBookingResponse(parsed) });
}
