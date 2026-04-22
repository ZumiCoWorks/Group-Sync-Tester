'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getLockoutCopy, WORKSUITE_DEV_MODE } from '../config';
import { useWorksuiteAuth } from '../auth/worksuite-auth';

const NAV_ITEMS = [
  { href: '/worksuite', label: 'Directory' },
  { href: '/worksuite/ops', label: 'Venue Booking' },
  { href: '/worksuite/slots', label: 'Booking Slots' },
];

const ROLE_LABELS: Record<string, string> = {
  operations: 'Operations',
  staff: 'Lecturer',
  student: 'Student',
};

export function WorksuiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, canToggleRole, setRole, setDisplayName } = useWorksuiteAuth();
  const lockCopy = getLockoutCopy();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_38%),linear-gradient(180deg,_rgba(45,212,191,0.08),_transparent_22%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="sticky top-3 z-30 mb-6 rounded-3xl border border-border bg-card/90 px-4 py-4 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-xl font-black text-primary">
                  AF
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">AFDA Worksuite</p>
                  <h1 className="text-xl font-black tracking-tight">Venues & Assessments</h1>
                </div>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{lockCopy}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-full border border-border bg-background p-1">
                {NAV_ITEMS.map((item) => (
                  <Button
                    key={item.href}
                    asChild
                    size="sm"
                    variant={pathname === item.href ? 'default' : 'ghost'}
                    className={cn(
                      'rounded-full px-4',
                      pathname === item.href ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {WORKSUITE_DEV_MODE ? 'DEV MODE' : 'Microsoft Auth Pending'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge className="rounded-full bg-primary px-3 py-1 text-primary-foreground hover:bg-primary">{ROLE_LABELS[user.role] ?? user.role.toUpperCase()}</Badge>
            <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-foreground">
              {user.displayName}
            </Badge>
            <Badge variant="outline" className="rounded-full border-border px-3 py-1 text-foreground">
              {user.email}
            </Badge>
            {canToggleRole && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="rounded-full border-border bg-background text-foreground hover:bg-secondary" onClick={() => setRole('operations')}>
                  Operations
                </Button>
                <Button size="sm" variant="outline" className="rounded-full border-border bg-background text-foreground hover:bg-secondary" onClick={() => setRole('staff')}>
                  Staff
                </Button>
                <Button size="sm" variant="outline" className="rounded-full border-border bg-background text-foreground hover:bg-secondary" onClick={() => setRole('student')}>
                  Student
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full text-muted-foreground hover:bg-secondary" onClick={() => setDisplayName(user.role === 'operations' ? 'Nomsa Operations' : user.role === 'staff' ? 'Daisy Tutor' : 'Nandi Student')}>
                  Reset name
                </Button>
              </div>
            )}
          </div>
        </header>

        <main className="relative flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
