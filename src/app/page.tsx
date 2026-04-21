import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarClock, Building2, LayoutGrid, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppTile = {
  title: string;
  roles: string;
  description: string;
  href: string;
  icon: ReactNode;
};

const appTiles: AppTile[] = [
  {
    title: 'Student Grouping',
    roles: 'Lecturer / Student',
    description: 'Create sessions, join by code, and group students live.',
    href: '/group-sync',
    icon: <UsersRound className="h-6 w-6" />,
  },
  {
    title: 'Venue Booking',
    roles: 'Operations / Lecturer / Student',
    description: 'Import registrar venue schedules and publish read-only occupancy timelines.',
    href: '/worksuite/ops',
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    title: 'Student Booking Slots',
    roles: 'Lecturer / Student',
    description: 'Generate tutor slots and let students claim exactly one slot in real time.',
    href: '/worksuite/slots',
    icon: <CalendarClock className="h-6 w-6" />,
  },
];

const shortcuts = [
  { label: 'Directory', href: '/' },
  { label: 'Grouping', href: '/group-sync' },
  { label: 'Venue Booking', href: '/worksuite/ops' },
  { label: 'Booking Slots', href: '/worksuite/slots' },
];

export const metadata = {
  title: 'AFDA Workspace',
  description: 'Launch Group Sync, Worksuite, and other AFDA tools from a clean app directory.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 md:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-white/15 bg-[#111111] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ff7f50] text-black">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/50">AFDA Workspace</p>
              <h1 className="text-lg font-black tracking-tight text-white">Assessment & Venue Suite</h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {shortcuts.map((shortcut) => (
              <Button key={shortcut.label} asChild variant="ghost" className="rounded-full px-4 text-white/70 hover:bg-white/10 hover:text-white">
                <Link href={shortcut.href}>{shortcut.label}</Link>
              </Button>
            ))}
          </div>
        </header>

        <section className="grid flex-1 items-start gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
          <div className="rounded-[2rem] border border-white/15 bg-[#0d0d0d] p-6 md:p-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#ff7f50]/40 bg-[#ff7f50]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#ffb39a]">
              <LayoutGrid className="h-4 w-4" />
              AFDA Launchpad
            </div>

            <h2 className="text-4xl font-black tracking-tight text-white md:text-6xl">Three apps. Clear lanes.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
              Start in the module you need: Student Grouping, Venue Booking, or Student Booking Slots. Each app keeps role boundaries explicit.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-full bg-[#ff7f50] px-6 py-6 text-black hover:bg-[#ff936d]">
                <Link href="/group-sync" className="inline-flex items-center gap-2">
                  Open Student Grouping
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-white/25 bg-transparent px-6 py-6 text-white hover:bg-white/10">
                <Link href="/worksuite/ops">Open Venue Booking</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Stat label="Apps ready" value="03" />
              <Stat label="Palette" value="AFDA" />
              <Stat label="State" value="Isolated" />
            </div>
          </div>

          <div id="directory" className="rounded-[2rem] border border-white/15 bg-[#0d0d0d] p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between px-2 pt-1">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">App Directory</p>
                <h3 className="text-2xl font-black text-white">Core Apps</h3>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">3 apps</div>
            </div>

            <div className="grid gap-3">
              {appTiles.map((app) => (
                <Link
                  key={app.title}
                  href={app.href}
                  className="group rounded-[1.5rem] border border-white/15 bg-black p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[#ff7f50]/60"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ff7f50]/40 text-[#ff7f50] bg-[#111111]">
                    {app.icon}
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-white">{app.title}</h4>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#ffb39a]">{app.roles}</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">{app.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ff9a79]">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/15 bg-black p-4">
              <p className="text-sm font-semibold text-white">Quick links</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MiniShortcut label="Join Grouping Session" href="/join" />
                <MiniShortcut label="Grouping History" href="/history" />
                <MiniShortcut label="Worksuite Directory" href="/worksuite" />
                <MiniShortcut label="Slot Booking" href="/worksuite/slots" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-black px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.25em] text-white/50">{label}</p>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function MiniShortcut({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-white/15 bg-[#111111] px-4 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white">
      {label}
    </Link>
  );
}
