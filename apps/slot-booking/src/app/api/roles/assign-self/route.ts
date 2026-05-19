import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { assignRoleToUser } from '@/lib/role-store';

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const role = body?.role as string | undefined;
  if (!role || (role !== 'lecturer' && role !== 'tutor')) {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }

  const assigned = await assignRoleToUser(session.user.email, role as 'lecturer' | 'tutor');
  return NextResponse.json({ assigned });
}
