import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Cloud, FolderKanban, History, LayoutGrid, School2, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AppTile = {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  tone: string;
};

const appTiles: AppTile[] = [
  {
    title: 'Group Sync',
    description: 'Host rooms, join sessions, and group students in real time.',
    href: '/group-sync',
    icon: <UsersRound className="h-6 w-6" />,
    tone: 'from-sky-500/20 to-cyan-400/10 text-sky-700',
  },
  {
    title: 'AFDA Worksuite',
    description: 'Venue bookings and assessment scheduling in a dark AFDA shell.',
    href: '/worksuite',
    icon: <FolderKanban className="h-6 w-6" />,
    tone: 'from-[#ff6f4d]/20 to-[#ffb39e]/10 text-[#d94f2b]',
  },
  {
    title: 'Demo Mode',
    description: 'Explore the grouping flow without live data.',
    href: '/demo',
    icon: <Cloud className="h-6 w-6" />,
    tone: 'from-violet-500/20 to-fuchsia-400/10 text-violet-700',
  },
  {
    title: 'Join Room',
    description: 'Enter a session code and join as a student.',
    href: '/join',
    icon: <School2 className="h-6 w-6" />,
    tone: 'from-emerald-500/20 to-teal-400/10 text-emerald-700',
  },
  {
    title: 'Session History',
    description: 'Review saved rooms and export old sessions.',
    href: '/history',
    icon: <History className="h-6 w-6" />,
    tone: 'from-amber-500/20 to-orange-400/10 text-amber-700',
  },
];

const shortcuts = [
  { label: 'Workspace', href: '/group-sync' },
  { label: 'Apps', href: '/' },
  { label: 'Worksuite', href: '/worksuite' },
  { label: 'Directory', href: '#directory' },
];

export const metadata = {
  title: 'AFDA Workspace',
  description: 'Launch Group Sync, Worksuite, and other AFDA tools from a clean app directory.',
};

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(117,185,255,0.22),_transparent_40%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-900">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-white/70 via-white/30 to-transparent" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 md:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-white/70 bg-white/60 px-4 py-3 shadow-[0_20px_60px_rgba(74,105,173,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-lg shadow-sky-500/30">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">AFDA Workspace</p>
              <h1 className="text-lg font-black tracking-tight text-slate-900">App Directory</h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {shortcuts.map((shortcut) => (
              <Button key={shortcut.label} asChild variant="ghost" className="rounded-full px-4 text-slate-600 hover:bg-slate-900/5 hover:text-slate-900">
                <Link href={shortcut.href}>{shortcut.label}</Link>
              </Button>
            ))}
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="relative rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_30px_90px_rgba(74,105,173,0.14)] backdrop-blur-xl md:p-10">
            <div className="absolute right-8 top-8 h-28 w-28 rounded-full bg-sky-400/25 blur-3xl" />
            <div className="absolute left-8 top-16 h-24 w-24 rounded-full bg-cyan-400/20 blur-3xl" />

            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
                <Cloud className="h-4 w-4" />
                Cloud workspace
              </div>

              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-sky-500 via-cyan-400 to-sky-300 text-white shadow-[0_20px_60px_rgba(56,161,255,0.35)]">
                  <Cloud className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Welcome</p>
                  <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">Choose your app.</h2>
                </div>
              </div>

              <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                This workspace starts with a calm app directory instead of dropping you straight into a single workflow. Open the app you need and keep Group Sync, Worksuite, and support tools separate.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-slate-900 px-6 py-6 text-white hover:bg-slate-800">
                  <Link href="/group-sync" className="inline-flex items-center gap-2">
                    Open Group Sync
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white/80 px-6 py-6 text-slate-700 hover:bg-slate-100">
                  <Link href="/worksuite">Open Worksuite</Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Stat label="Apps ready" value="05" />
                <Stat label="Theme" value="iCloud x Zoho" />
                <Stat label="Safe routes" value="Isolated" />
              </div>
            </div>
          </div>

          <div id="directory" className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_30px_90px_rgba(74,105,173,0.12)] backdrop-blur-xl md:p-6">
            <div className="mb-4 flex items-center justify-between px-2 pt-1">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">App Directory</p>
                <h3 className="text-2xl font-black text-slate-900">Launchpad</h3>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">6 apps</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {appTiles.map((app) => (
                <Link
                  key={app.title}
                  href={app.href}
                  className="group rounded-[1.5rem] border border-slate-200/80 bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(74,105,173,0.16)]"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${app.tone}`}>
                    {app.icon}
                  </div>
                  <h4 className="mt-4 text-lg font-bold text-slate-900">{app.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{app.description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Recently used</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MiniShortcut label="Group Sync" href="/group-sync" />
                <MiniShortcut label="Worksuite" href="/worksuite" />
                <MiniShortcut label="Join room" href="/join" />
                <MiniShortcut label="Session history" href="/history" />
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
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function MiniShortcut({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">
      {label}
    </Link>
  );
}
