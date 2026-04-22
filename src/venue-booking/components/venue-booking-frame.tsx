'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVenueBookingAuth } from '@/venue-booking/auth/venue-booking-auth';

const NAV_ITEMS = [
  { href: '/venue-booking', label: 'Overview' },
  { href: '/', label: 'Directory' },
];

export function VenueBookingFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useVenueBookingAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_38%),linear-gradient(180deg,_rgba(45,212,191,0.08),_transparent_22%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="sticky top-3 z-30 mb-6 rounded-3xl border border-border bg-card/90 px-4 py-4 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AFDA App</p>
              <h1 className="text-xl font-black tracking-tight text-foreground">Venue Booking</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Operations-only venue import and occupancy timeline.</p>
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
            <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">Operations</Badge>
            <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-foreground">{user.displayName}</Badge>
          </div>
        </header>

        <main className="relative flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}