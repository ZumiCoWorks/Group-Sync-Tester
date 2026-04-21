'use client';

import Link from 'next/link';
import { CalendarClock, UserRoundCheck, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WorksuiteSlotsPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-border bg-card p-6 text-card-foreground shadow-xl md:p-8">
        <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-primary">
          Student Booking Slots
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-tight text-foreground md:text-5xl">Lecturer + Student flow, split by role.</h2>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          This app has two role views: lecturers create assessment slots, and students claim one slot each. Slots gray out instantly once claimed.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/worksuite/tutor"
            className="group rounded-2xl border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-foreground">Lecturer View</h3>
            <p className="mt-2 text-sm text-muted-foreground">Generate slots by venue, duration, and date range.</p>
            <p className="mt-4 text-sm font-semibold text-primary">Open lecturer flow</p>
          </Link>

          <Link
            href="/worksuite/student"
            className="group rounded-2xl border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <UserRoundCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-foreground">Student View</h3>
            <p className="mt-2 text-sm text-muted-foreground">Claim one available slot and lock your booking.</p>
            <p className="mt-4 text-sm font-semibold text-primary">Open student flow</p>
          </Link>
        </div>
      </Card>

      <Card className="border-border bg-card p-6 text-card-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Roles</p>
            <h3 className="text-xl font-bold text-foreground">Access Matrix</h3>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Lecturer</p>
            <p className="mt-2 text-sm text-muted-foreground">Create slots, assign venues, and monitor claims.</p>
          </div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Student</p>
            <p className="mt-2 text-sm text-muted-foreground">View open slots and reserve exactly one booking.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/worksuite/tutor">Lecturer flow</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-border bg-background text-foreground hover:bg-secondary">
            <Link href="/worksuite/student">Student flow</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}
