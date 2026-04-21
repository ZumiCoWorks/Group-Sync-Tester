'use client';

import Link from 'next/link';
import { CalendarClock, UserRoundCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WorksuiteSlotsPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-white/20 bg-[#0f0f0f] p-6 text-white shadow-2xl shadow-black/35 md:p-8">
        <p className="inline-flex rounded-full border border-[#ff6f4d]/30 bg-[#ff6f4d]/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[#ffb39a]">
          Student Booking Slots
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Lecturer + Student flow, split by role.</h2>
        <p className="mt-4 max-w-2xl text-base text-white/80 md:text-lg">
          This app has two role views: lecturers create assessment slots, and students claim one slot each. Slots gray out instantly once claimed.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/worksuite/tutor"
            className="group rounded-2xl border border-white/20 bg-black p-4 transition-colors hover:border-[#ff6f4d]/60"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ff6f4d]/40 bg-[#111111] text-[#ff7f50]">
              <CalendarClock className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Lecturer View</h3>
            <p className="mt-2 text-sm text-white/75">Generate slots by venue, duration, and date range.</p>
            <p className="mt-4 text-sm font-semibold text-[#ff9a79]">Open lecturer flow</p>
          </Link>

          <Link
            href="/worksuite/student"
            className="group rounded-2xl border border-white/20 bg-black p-4 transition-colors hover:border-[#ff6f4d]/60"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#ff6f4d]/40 bg-[#111111] text-[#ff7f50]">
              <UserRoundCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-bold">Student View</h3>
            <p className="mt-2 text-sm text-white/75">Claim one available slot and lock your booking.</p>
            <p className="mt-4 text-sm font-semibold text-[#ff9a79]">Open student flow</p>
          </Link>
        </div>
      </Card>

      <Card className="border-white/20 bg-[#0f0f0f] p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff6f4d]/40 bg-black text-[#ff7f50]">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Roles</p>
            <h3 className="text-xl font-bold">Access Matrix</h3>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-white/20 bg-black p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#ffb39a]">Lecturer</p>
            <p className="mt-2 text-sm text-white/80">Create slots, assign venues, and monitor claims.</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-black p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#ffb39a]">Student</p>
            <p className="mt-2 text-sm text-white/80">View open slots and reserve exactly one booking.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-full bg-[#ff6f4d] text-black hover:bg-[#ff8a68]">
            <Link href="/worksuite/tutor">Lecturer flow</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10">
            <Link href="/worksuite/student">Student flow</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}
