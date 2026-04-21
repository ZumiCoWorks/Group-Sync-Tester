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

export function WorksuiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, canToggleRole, setRole, setDisplayName } = useWorksuiteAuth();
  const lockCopy = getLockoutCopy();

  return (
    <div className="min-h-screen bg-[#000000] text-[#ffffff]">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(255,127,80,0.16),_transparent_35%),linear-gradient(180deg,_rgba(255,127,80,0.03),_transparent_18%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="sticky top-3 z-30 mb-6 rounded-3xl border border-white/20 bg-[#0d0d0d] px-4 py-4 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(255,127,80,0.14)] text-xl font-black text-[#ff6f4d]">
                  AF
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">AFDA Worksuite</p>
                  <h1 className="text-xl font-black tracking-tight">Venues & Assessments</h1>
                </div>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-white/75">{lockCopy}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black p-1">
                {NAV_ITEMS.map((item) => (
                  <Button
                    key={item.href}
                    asChild
                    size="sm"
                    variant={pathname === item.href ? 'default' : 'ghost'}
                    className={cn(
                      'rounded-full px-4',
                      pathname === item.href ? 'bg-[#ff6f4d] text-black hover:bg-[#ff8a68]' : 'text-white/75 hover:bg-white/10'
                    )}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black px-3 py-2 text-sm text-white/85">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {WORKSUITE_DEV_MODE ? 'DEV MODE' : 'Microsoft Auth Pending'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge className="rounded-full bg-[#ff6f4d] px-3 py-1 text-black hover:bg-[#ff6f4d]">{user.role.toUpperCase()}</Badge>
            <Badge variant="outline" className="rounded-full border-white/25 px-3 py-1 text-white/90">
              {user.displayName}
            </Badge>
            <Badge variant="outline" className="rounded-full border-white/25 px-3 py-1 text-white/90">
              {user.email}
            </Badge>
            {canToggleRole && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="rounded-full border-white/30 bg-black text-white hover:bg-white/10" onClick={() => setRole('staff')}>
                  Staff
                </Button>
                <Button size="sm" variant="outline" className="rounded-full border-white/30 bg-black text-white hover:bg-white/10" onClick={() => setRole('student')}>
                  Student
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full text-white/70 hover:bg-white/10" onClick={() => setDisplayName(user.role === 'staff' ? 'Daisy Ops' : 'Nandi Student')}>
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
