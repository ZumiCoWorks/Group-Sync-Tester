import { NextRequest, NextResponse } from 'next/server';
import { getAssignedRole } from '@/lib/role-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') ?? '';
  if (!email) return NextResponse.json({ role: null });
  const role = await getAssignedRole(email);
  return NextResponse.json({ role });
}
