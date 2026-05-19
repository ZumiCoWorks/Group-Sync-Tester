'use client';

import Link from 'next/link';
import { CalendarClock, LayoutDashboard, UserRoundCheck, ArrowRight, Sparkles, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function SlotBookingOverviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [role, setRole] = useState<'operations' | 'lecturer' | 'tutor' | 'student' | 'admin' | 'unassigned' | null>(null);

  useEffect(() => {
    async function resolve() {
      const email = session?.user?.email ?? '';
      if (!email) {
        setRole(null);
        return;
      }

      if (email.endsWith('@students.afda.co.za')) {
        setRole('student');
        return;
      }

      try {
        const res = await fetch(`/api/roles/assigned?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        const assigned = data?.role ?? null;
        if (assigned === 'operations' || assigned === 'lecturer' || assigned === 'tutor' || assigned === 'student') {
          if (assigned === 'operations') {
            router.replace('/venue-ops');
            return;
          }
          setRole(assigned);
          return;
        }

        // check if admin
        const adminList = (process.env.NEXT_PUBLIC_AFDA_ADMIN_EMAILS || process.env.AFDA_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase());
        if (adminList.includes(email.toLowerCase())) {
          router.replace('/venue-ops');
          setRole('admin');
          return;
        }

        setRole('unassigned');
      } catch (e) {
        setRole('unassigned');
      }
    }

    resolve();
  }, [session]);
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden border-border bg-card text-card-foreground shadow-2xl shadow-blue-500/5">
        <div className="border-b border-border bg-gradient-to-r from-blue-600/10 via-white to-emerald-500/10 px-6 py-5 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-700">AFDA dashboard</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-foreground md:text-5xl">Worksuite Booking</h2>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-lg">
                A university-style control surface for venue booking, lecturer slot creation, tutor delegation, and student reservations.
              </p>
            </div>
            <Badge className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-600">{role ?? 'loading'}</Badge>
          </div>
        </div>

        <div className="grid gap-4 border-b border-border px-6 py-5 md:grid-cols-4 md:px-8">
          <Metric label="Active lane" value={role === 'admin' ? 'Admin' : role ? role[0].toUpperCase() + role.slice(1) : 'Loading'} />
          <Metric label="Published slots" value="Live" />
          <Metric label="Booking rule" value="One claim" />
          <Metric label="Calendar" value="Graph first" />
        </div>

        <div className="px-6 py-6 md:px-8">
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-950">
            <Sparkles className="h-4 w-4" />
            Choose the lane you need. Each app keeps role boundaries explicit, but the visual system stays unified.
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {(role === 'lecturer' || role === 'tutor') && <DashCard href="/slot-booking/lecturer" icon={<CalendarClock className="h-5 w-5" />} title="Slot Creator" text="Create batches, manage delegations, and publish student-facing slots." cta="Open slot creator" />}
            {role === 'student' && <DashCard href="/slot-booking/student" icon={<UserRoundCheck className="h-5 w-5" />} title="Student View" text="Claim one published slot and keep the booking flow mobile-first." cta="Open student flow" />}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/slot-booking">Open booking hub</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-border bg-background text-foreground hover:bg-secondary">
              <Link href="/slot-booking/student">Open student flow</Link>
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-border bg-card p-6 text-card-foreground shadow-2xl shadow-blue-500/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Access matrix</p>
            <h3 className="text-xl font-bold text-foreground">Role lanes</h3>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <InfoRow label="Lecturer" text="Own slot creation, publishing, delegations, and calendar sync." />
          <InfoRow label="Tutor" text="Delegated slot creation and batch publishing under lecturer ownership." />
          <InfoRow label="Student" text="View open slots and reserve exactly one booking." />
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-blue-700" />
            What’s next
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Lecturer and tutor lanes share the same booking engine, but the student lane is intentionally stripped back so it reads like a fast mobile app.
          </p>
        </div>
      </Card>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-secondary/40 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function DashCard({ href, icon, title, text, cta }: { href: string; icon: React.ReactNode; title: string; text: string; cta: string }) {
  return (
    <Link href={href} className="group rounded-[1.5rem] border border-border bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-blue-500/5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 text-xl font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}