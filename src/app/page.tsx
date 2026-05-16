import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, CalendarClock, ChevronRight, CircleDollarSign, LayoutGrid, Sparkles, UsersRound, WalletCards, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthActions } from '@/components/shared/auth-actions';

type AppTile = {
  title: string;
  roles: string;
  description: string;
  href: string;
  icon: ReactNode;
  accent: string;
};

const appTiles: AppTile[] = [
  {
    title: 'Student Grouping',
    roles: 'Lecturer / Student',
    description: 'Create sessions, join by code, and group students live.',
    href: '/group-sync',
    icon: <UsersRound className="h-6 w-6" />,
    accent: 'from-sky-400/30 to-cyan-400/10',
  },
  {
    title: 'Venue Booking',
    roles: 'Operations only',
    description: 'Import venue schedules and publish read-only occupancy timelines.',
    href: '/venue-booking',
    icon: <Building2 className="h-6 w-6" />,
    accent: 'from-emerald-400/30 to-teal-400/10',
  },
  {
    title: 'Slot Creator',
    roles: 'Lecturer / Tutor',
    description: 'Create slot batches, delegate to tutors, and publish slots for students.',
    href: '/slot-booking/lecturer',
    icon: <CalendarClock className="h-6 w-6" />,
    accent: 'from-violet-400/30 to-fuchsia-400/10',
  },
  {
    title: 'Student Booking',
    roles: 'Student',
    description: 'Find available slots and reserve a single booking.',
    href: '/slot-booking/student',
    icon: <WalletCards className="h-6 w-6" />,
    accent: 'from-amber-400/30 to-orange-400/10',
  },
];

const shortcuts = [
  { label: 'Directory', href: '/' },
  { label: 'Grouping', href: '/group-sync' },
  { label: 'Venue Booking', href: '/venue-booking' },
  { label: 'Booking Slots', href: '/slot-booking' },
];

export const metadata = {
  title: 'AFDA Workspace',
  description: 'Launch Group Sync, Worksuite, and other AFDA tools from a clean app directory.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.28),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_24%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 py-4 md:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-[#11131d]/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.34em] text-white/55">AFDA Workspace</p>
                <h1 className="text-xl font-black tracking-tight md:text-2xl">University dashboard launchpad</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {shortcuts.map((shortcut) => (
                <Button key={shortcut.label} asChild variant="ghost" className="rounded-full px-4 text-white/70 hover:bg-white/10 hover:text-white">
                  <Link href={shortcut.href}>{shortcut.label}</Link>
                </Button>
              ))}
              <AuthActions />
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-6 lg:grid-cols-[1.02fr_0.98fr] lg:py-8">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#10131d]/95 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            <div className="border-b border-white/10 bg-[linear-gradient(135deg,_rgba(168,85,247,0.95),_rgba(59,130,246,0.92))] px-6 py-6 text-white md:px-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Campus control surface
              </div>
              <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="max-w-xl text-4xl font-black tracking-tight md:text-5xl">One campus suite. Clear role lanes.</h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
                    A focused launchpad for student grouping, venue booking, and slot creation. Each app stays distinct while sharing one polished entry point.
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-white/15 bg-black/20 px-4 py-3 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/60">
                    <BellRing className="h-3.5 w-3.5" />
                    System status
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <CircleDollarSign className="h-7 w-7 text-white/85" />
                    <span className="text-3xl font-black">04</span>
                    <span className="pb-1 text-sm text-white/70">apps live</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-white px-6 py-6 text-slate-950 hover:bg-white/90">
                  <Link href="/slot-booking" className="inline-flex items-center gap-2">
                    Open booking hub
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-white/20 bg-white/10 px-6 py-6 text-white hover:bg-white/15 hover:text-white">
                  <Link href="/group-sync">Open student grouping</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 p-6 md:grid-cols-3 md:p-8">
              <Stat label="Apps ready" value="04" />
              <Stat label="Role lanes" value="04" />
              <Stat label="Status" value="Live" />
            </div>
          </div>

          <div id="directory" className="rounded-[2rem] border border-white/10 bg-[#111522]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-5">
            <div className="mb-4 flex items-center justify-between px-2 pt-1">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">App directory</p>
                <h3 className="text-2xl font-black text-white">Core applications</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">4 apps</div>
            </div>

            <div className="grid gap-3">
              {appTiles.map((app) => (
                <Link
                  key={app.title}
                  href={app.href}
                  className="group rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-[0_18px_40px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${app.accent} text-white`}>
                        {app.icon}
                      </div>
                      <h4 className="mt-4 text-lg font-bold text-white">{app.title}</h4>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-emerald-300">{app.roles}</p>
                      <p className="mt-2 text-sm leading-6 text-white/65">{app.description}</p>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 text-white/35 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MiniShortcut label="Join Grouping Session" href="/join" />
              <MiniShortcut label="Grouping History" href="/history" />
              <MiniShortcut label="Venue Booking" href="/venue-booking" />
              <MiniShortcut label="Slot Booking" href="/slot-booking" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function MiniShortcut({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white">
      {label}
    </Link>
  );
}
