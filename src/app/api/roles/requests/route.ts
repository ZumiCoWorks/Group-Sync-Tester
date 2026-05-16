import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { listRoleRequests } from '@/lib/role-store';

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any;
  const adminList = (process.env.AFDA_ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!session?.user?.email || !adminList.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const all = await listRoleRequests();
  return NextResponse.json({ requests: all });
}
