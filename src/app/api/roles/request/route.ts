import { NextRequest, NextResponse } from 'next/server';
import { saveRoleRequest } from '@/lib/role-store';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, role } = body as { email?: string; role?: string };
  if (!email || !role) {
    return NextResponse.json({ error: 'email and role required' }, { status: 400 });
  }

  if (role !== 'operations' && role !== 'lecturer' && role !== 'tutor') {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }

  const req = {
    id: crypto.randomUUID(),
    email: email.toString().toLowerCase(),
    role: role as 'operations' | 'lecturer' | 'tutor',
    status: 'pending' as const,
    createdAt: Date.now(),
  };

  await saveRoleRequest(req);
  return NextResponse.json({ request: req });
}
