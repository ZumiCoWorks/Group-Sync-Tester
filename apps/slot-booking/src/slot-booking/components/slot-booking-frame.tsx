'use client';

import { Badge } from '@/components/ui/badge';
import { useSlotBookingAuth } from '@/slot-booking/auth/slot-booking-auth';
import { roleLabel } from '@/worksuite/authority';

export function SlotBookingFrame({ children }: { children: React.ReactNode }) {
  const { user } = useSlotBookingAuth();

  return (
    <div className="min-h-screen bg-background text-foreground app-shell-bg">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_38%),linear-gradient(180deg,_rgba(251,146,60,0.08),_transparent_22%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="app-panel sticky top-3 z-30 mb-6 px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">{roleLabel(user.role)}</Badge>
            <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-foreground">{user.displayName}</Badge>
          </div>
        </header>

        <main className="relative flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}