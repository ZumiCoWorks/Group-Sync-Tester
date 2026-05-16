'use client';

import { useSlotBookingAuth } from '@/slot-booking/auth/slot-booking-auth';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NotificationItem = {
  id: string;
  type: 'approval' | 'booking' | 'confirmation' | 'assignment';
  message: string;
  timestamp: Date;
  actionUrl?: string;
};

type NotificationBadgeProps = {
  tone?: 'blue' | 'emerald' | 'orange' | 'amber';
  pendingCount?: number;
  onBellClick?: () => void;
};

const toneNotificationColors = {
  blue: 'bg-blue-600 text-white hover:bg-blue-700',
  emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
  orange: 'bg-orange-600 text-white hover:bg-orange-700',
  amber: 'bg-amber-600 text-white hover:bg-amber-700',
};

export function NotificationBadge({ tone = 'blue', pendingCount = 0, onBellClick }: NotificationBadgeProps) {
  const { role } = useSlotBookingAuth();

  const getNotificationLabel = () => {
    switch (role) {
      case 'operations':
        return 'Pending Approvals';
      case 'lecturer':
      case 'tutor':
        return 'Pending Confirmations';
      case 'student':
        return 'Your Bookings';
      default:
        return 'Notifications';
    }
  };

  if (pendingCount === 0) {
    return null;
  }

  const colorClass = toneNotificationColors[tone];

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onBellClick}
      className={cn('relative gap-2 rounded-full border border-gray-200 px-3 py-1', colorClass)}
    >
      <Bell className="h-4 w-4 flex-shrink-0" />
      <span className="text-xs font-semibold">{pendingCount}</span>
      <span className="hidden text-xs font-normal sm:inline">{getNotificationLabel()}</span>
      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 p-0 text-xs font-bold text-white flex items-center justify-center">
        {pendingCount > 9 ? '9+' : pendingCount}
      </Badge>
    </Button>
  );
}

export function NotificationPanel({ items, onItemClick }: { items: NotificationItem[]; onItemClick?: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-sm text-slate-500">No notifications</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 space-y-2 overflow-y-auto">
      {items.map((item) => (
        <div
          key={item.id}
          className="cursor-pointer rounded-lg border border-slate-100 bg-slate-50 p-3 hover:bg-slate-100 transition-colors"
          onClick={() => onItemClick?.(item.id)}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0', {
                'bg-blue-600': item.type === 'approval',
                'bg-emerald-600': item.type === 'confirmation',
                'bg-orange-600': item.type === 'booking',
                'bg-amber-600': item.type === 'assignment',
              })}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{item.message}</p>
              <p className="text-xs text-slate-500 mt-1">{formatTime(item.timestamp)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
