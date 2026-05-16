'use client';

import { useMemo } from 'react';
import { useSlotBookingAuth } from '@/slot-booking/auth/slot-booking-auth';

type NotificationItem = {
  id: string;
  type: 'approval' | 'booking' | 'confirmation' | 'assignment';
  message: string;
  timestamp: Date;
  actionUrl?: string;
};

/**
 * Hook to get notifications based on user role
 * Can be extended to fetch from actual data sources like Firestore
 */
export function useNotifications(pendingApprovals?: number, pendingBookings?: number) {
  const { role } = useSlotBookingAuth();

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    switch (role) {
      case 'lecturer':
      case 'tutor': {
        // Lecturers/tutors see pending slot confirmations
        if (pendingBookings && pendingBookings > 0) {
          items.push({
            id: 'confirmations-pending',
            type: 'confirmation',
            message: `${pendingBookings} booking${pendingBookings !== 1 ? 's' : ''} need confirmation`,
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            actionUrl: '/slot-booking/lecturer',
          });
        }
        break;
      }

      case 'student': {
        // Students see their booking confirmations
        if (pendingBookings && pendingBookings > 0) {
          items.push({
            id: 'bookings-pending',
            type: 'booking',
            message: `${pendingBookings} of your booking${pendingBookings !== 1 ? 's' : ''} confirmed`,
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            actionUrl: '/slot-booking/student',
          });
        }
        break;
      }
    }

    return items;
  }, [role, pendingApprovals, pendingBookings]);

  const unreadCount = notifications.length;

  return {
    notifications,
    unreadCount,
    hasNotifications: unreadCount > 0,
  };
}
