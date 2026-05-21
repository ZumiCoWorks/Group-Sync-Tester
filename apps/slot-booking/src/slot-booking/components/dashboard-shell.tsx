'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useSlotBookingAuth } from '@/slot-booking/auth/slot-booking-auth';
import { Bell, LayoutGrid, LogOut, Moon, Sun } from 'lucide-react';

export type DashboardNavItem = {
  href: string;
  label: string;
  description?: string;
};

type DashboardShellProps = {
  tone: 'blue' | 'emerald' | 'orange' | 'amber';
  eyebrow: string;
  title: string;
  description?: string;
  badgeLabel: string;
  navItems: DashboardNavItem[];
  pendingCount?: number;
  children: ReactNode;
};

const toneClasses = {
  blue: {
    badge: 'bg-blue-600 text-white hover:bg-blue-600',
    navActive: 'border-blue-300/60 bg-blue-100 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200',
  },
  emerald: {
    badge: 'bg-emerald-600 text-white hover:bg-emerald-600',
    navActive: 'border-emerald-300/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200',
  },
  orange: {
    badge: 'bg-orange-600 text-white hover:bg-orange-600',
    navActive: 'border-orange-300/60 bg-orange-100 text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-200',
  },
  amber: {
    badge: 'bg-amber-600 text-white hover:bg-amber-600',
    navActive: 'border-amber-300/60 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200',
  },
} as const;

export function DashboardShell({ tone, eyebrow, title, description, badgeLabel, navItems, pendingCount = 0, children }: DashboardShellProps) {
  const { user, signOutUrl } = useSlotBookingAuth();
  const [uiTheme, setUiTheme] = useState<'light' | 'dark'>('dark');

  const theme = toneClasses[tone];
  const pathname = usePathname();
  const appBase = pathname ? `/${pathname.split('/')[1]}` : '/slot-booking';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('slot-booking-theme');
    if (stored === 'light' || stored === 'dark') {
      setUiTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', uiTheme === 'dark');
    window.localStorage.setItem('slot-booking-theme', uiTheme);
  }, [uiTheme]);

  // Only show nav items that belong to the current app base (e.g. '/slot-booking').
  const localNavItems = navItems.filter((item) => {
    // Keep anchors and external links, but restrict in-repo links to the same app base
    if (item.href.startsWith('#') || item.href.startsWith('http')) return true;
    return item.href.startsWith(appBase);
  });

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f8f7] text-slate-900 transition-colors dark:bg-[#0b0f0d] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.06),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_35%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.34),_transparent_35%)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-[1480px] gap-4 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden">
          <div className="flex items-center gap-3 px-1 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">AFDA</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{badgeLabel}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {localNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'block rounded-lg border px-3 py-2 text-sm transition',
                    active
                      ? theme.navActive
                      : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#16201b] dark:hover:text-white',
                  )}
                >
                  <p className="font-medium">{item.label}</p>
                  {item.description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-2 pt-4">
            <MiniStat label="Active lane" value={badgeLabel} />
            <MiniStat label="User" value={user.displayName.split(' ')[0]} />
          </div>
        </aside>

        <section className="rounded-2xl border border-slate-200/90 bg-white/90 shadow-sm backdrop-blur dark:border-[#1f2a23] dark:bg-[#0f1512]">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3 dark:border-[#1f2a23] md:px-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{eyebrow}</p>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:text-xl">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 dark:border-[#253228] dark:bg-[#131d17] dark:text-slate-200">
                  <Bell className="h-3.5 w-3.5" />
                  {pendingCount}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUiTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-[#253228] dark:bg-[#131d17] dark:text-slate-200 dark:hover:bg-[#18231c]"
                aria-label="Toggle theme"
              >
                {uiTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Badge className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', theme.badge)}>{badgeLabel}</Badge>
              <Button asChild variant="ghost" size="sm" className="rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-[#253228] dark:bg-[#131d17] dark:text-slate-200 dark:hover:bg-[#18231c]">
                <Link href={signOutUrl}>
                  <LogOut className="h-4 w-4" />
                  <span className="ml-1">Sign out</span>
                </Link>
              </Button>
            </div>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200/80 px-4 py-3 dark:border-[#1f2a23] md:hidden">
            {localNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs',
                    active
                      ? theme.navActive
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#253228] dark:text-slate-300 dark:hover:bg-[#18231c]',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-4 py-4 md:px-6 md:py-6">
            {description ? <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
            <main>{children}</main>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-[#253228] dark:bg-[#131d17]">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
