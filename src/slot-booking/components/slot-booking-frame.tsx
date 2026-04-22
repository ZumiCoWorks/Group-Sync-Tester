'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSlotBookingAuth } from '@/slot-booking/auth/slot-booking-auth';

const NAV_ITEMS = [
  { href: '/slot-booking', label: 'Overview' },
  { href: '/slot-booking/tutor', label: 'Lecturer' },
  { href: '/slot-booking/student', label: 'Student' },
  { href: '/', label: 'Directory' },
];

export function SlotBookingFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, canToggleRole, setRole } = useSlotBookingAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.12),_transparent_38%),linear-gradient(180deg,_rgba(251,146,60,0.08),_transparent_22%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="sticky top-3 z-30 mb-6 rounded-3xl border border-border bg-card/90 px-4 py-4 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AFDA App</p>
              <h1 className="text-xl font-black tracking-tight text-foreground">Student Booking Slots</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Lecturer and student slot booking, split into their own views.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  size="sm"
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  className={cn('rounded-full px-4', pathname === item.href ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:bg-secondary')}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">{user.role === 'staff' ? 'Lecturer' : 'Student'}</Badge>
            <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-foreground">{user.displayName}</Badge>
            {canToggleRole && (
              <>
                <Button size="sm" variant="outline" className="rounded-full border-border bg-background text-foreground hover:bg-secondary" onClick={() => setRole('staff')}>
                  Lecturer Role
                </Button>
                <Button size="sm" variant="outline" className="rounded-full border-border bg-background text-foreground hover:bg-secondary" onClick={() => setRole('student')}>
                  Student Role
                </Button>
              </>
            )}
          </div>
        </header>

        <main className="relative flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}