import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { getAssignedRole } from '@/lib/role-store';

export default async function SlotBookingPage() {
  const session = (await getServerSession(authOptions as any)) as any;
  const email = session?.user?.email?.toString().trim().toLowerCase() ?? '';

  if (email) {
    const assigned = await getAssignedRole(email);
    const isStudent = email.endsWith('@students.afda.co.za');

    if (assigned === 'operations') {
      redirect('/venue-ops');
    }

    if (assigned === 'lecturer' || assigned === 'tutor') {
      redirect('/slot-booking/lecturer');
    }

    if (assigned === 'student' || isStudent) {
      redirect('/slot-booking/student');
    }

    if (!isStudent && !assigned) {
      redirect('/slot-booking/onboarding');
    }
  }

  redirect('/slot-booking/student');
}