import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { assignRoleToUser, clearRoleForUser, getAssignedRole } from '@/lib/role-store';

type AssignableRole = 'operations' | 'lecturer' | 'tutor' | 'student' | 'none';

function isAdminEmail(email: string) {
  const adminList = (process.env.AFDA_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return adminList.includes(email.toLowerCase());
}

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const role = body?.role as AssignableRole | undefined;

  if (!role || !['operations', 'lecturer', 'tutor', 'student', 'none'].includes(role)) {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }

  if (role === 'none') {
    await clearRoleForUser(email);
  } else {
    await assignRoleToUser(email, role);
  }

  const assigned = await getAssignedRole(email);
  return NextResponse.json({ assigned });
}
