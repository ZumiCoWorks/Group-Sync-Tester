'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Building2, Smartphone, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWorksuiteAuth } from '../auth/worksuite-auth';

const stats = [
  { label: 'Excel import', value: 'xlsx / csv' },
  { label: 'Namespace', value: 'worksuite_v1' },
  { label: 'Lockout', value: 'Thursday 14:00' },
];

export function WorksuiteLandingPage() {
  const { user } = useWorksuiteAuth();

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-white/10 bg-white/5 p-6 md:p-10 text-white shadow-2xl shadow-black/40 backdrop-blur-xl">
        <p className="mb-4 inline-flex rounded-full border border-[#ff6f4d]/30 bg-[#ff6f4d]/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-[#ffb39e]">
          Phase 1 | Mock Integration
        </p>
        <h2 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
          AFDA Worksuite centralises venues, assessment slots, and student bookings.
        </h2>
        <p className="mt-5 max-w-2xl text-lg text-white/70 md:text-xl">
          Built as an isolated expansion of Group Sync: import legacy Excel schedules, map columns to venues, generate tutor slots, and let students claim one booking each on mobile.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">{stat.label}</p>
              <p className="mt-2 text-lg font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="rounded-full bg-[#ff6f4d] px-6 text-black hover:bg-[#ff8a68]">
            <Link href="/worksuite/ops" className="inline-flex items-center gap-2">
              Open Ops
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10">
            <Link href="/worksuite/tutor">Open Tutor Suite</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-white/20 bg-transparent px-6 text-white hover:bg-white/10">
            <Link href="/worksuite/student">Open Student Portal</Link>
          </Button>
        </div>

        <div className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          <ShieldAlert className="h-5 w-5 text-[#ff6f4d]" />
          <span>This module stays isolated from Group Sync collections and uses the <strong>worksuite_v1</strong> Firestore namespace only.</span>
        </div>
      </Card>

      <div className="grid gap-4">
        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-black/20 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#ff6f4d]/15 p-3 text-[#ff8a68]"><Building2 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Operations</p>
              <h3 className="text-xl font-bold">Venue Manager</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/70">Import Registrar spreadsheets, map columns, and populate venue records for the timeline view.</p>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-black/20 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#ff6f4d]/15 p-3 text-[#ff8a68]"><CalendarDays className="h-5 w-5" /></div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Assessment</p>
              <h3 className="text-xl font-bold">Tutor Slot Creator</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/70">Create slot blocks for venues, then log calendar events through a mock Graph wrapper.</p>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-black/20 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#ff6f4d]/15 p-3 text-[#ff8a68]"><Smartphone className="h-5 w-5" /></div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Student</p>
              <h3 className="text-xl font-bold">Mobile Booking Portal</h3>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/70">Students claim one slot, with real-time gray-out behaviour once a slot is booked.</p>
        </Card>
      </div>
    </section>
  );
}
