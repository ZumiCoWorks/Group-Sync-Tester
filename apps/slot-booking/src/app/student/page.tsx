import { redirect } from 'next/navigation';
import { SlotBookingStudentPage as SlotBookingStudentScreen } from '@/slot-booking/pages/slot-booking-student';

export default function SlotBookingStudentRoute() {
  const preferCreatorSurface = process.env.NODE_ENV !== 'production' || process.env.FORCE_CREATOR_SURFACE === 'true';

  if (preferCreatorSurface) {
    redirect('/lecturer');
  }

  return <SlotBookingStudentScreen />;
}