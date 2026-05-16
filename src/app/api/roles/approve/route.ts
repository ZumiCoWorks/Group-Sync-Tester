import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { updateRoleRequestStatus, assignRoleToUser } from '@/lib/role-store';

export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  const adminList = (process.env.AFDA_ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!session?.user?.email || !adminList.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { id, approve } = body as { id?: string; approve?: boolean };
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const status = approve ? 'approved' : 'rejected';
  const updated = await updateRoleRequestStatus(id, status as any);
  if (!updated) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  if (approve) {
    // assign role to user
    await assignRoleToUser(updated.email, updated.role);
  }

  return NextResponse.json({ updated });
}
