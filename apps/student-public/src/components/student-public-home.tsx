'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock3, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSlotBookingStore } from '@/slot-booking/store/use-slot-booking-store';

export function StudentPublicHome() {
  const store = useSlotBookingStore();
  const [batchId, setBatchId] = useState(store.slotBatches[0]?.id ?? '');

  const batches = useMemo(
    () => store.slotBatches.filter((batch) => batch.isPublished),
    [store.slotBatches],
  );

  return (
    <div className="min-h-screen bg-[#07111a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.08),_transparent_22%)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-[#101722]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-white/45">Student Booking</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Tap. Claim. Done.</h1>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/60">{batches.length} live</div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-white/70 sm:text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <Phone className="mb-2 h-4 w-4 text-emerald-400" />
              Mobile first
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <ShieldCheck className="mb-2 h-4 w-4 text-emerald-400" />
              Public only
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <Clock3 className="mb-2 h-4 w-4 text-emerald-400" />
              Fast booking
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-4 sm:mt-6">
          <Card className="border-white/10 bg-[#111a26]/95 p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
              <Sparkles className="h-3.5 w-3.5" />
              Open batch
            </div>

            <div className="mt-4 space-y-3">
              <Input
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
                placeholder="Paste a batch id"
                className="h-12 border-white/10 bg-white/5 text-white placeholder:text-white/35"
              />
              <Button asChild className="h-12 w-full rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Link href={batchId ? `/public/${batchId}` : '/'}>Open booking page</Link>
              </Button>
            </div>
          </Card>

          <Card className="border-white/10 bg-[#111a26]/95 p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Live batches</p>
                <h2 className="text-xl font-black text-white">Available now</h2>
              </div>
            </div>

            <ScrollArea className="mt-4 h-[58vh] pr-2">
              <div className="space-y-3">
                {batches.map((batch) => (
                  <Link
                    key={batch.id}
                    href={`/public/${batch.id}`}
                    className="group block rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <CalendarDays className="h-4 w-4 text-emerald-400" />
                          {batch.locationLabel}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/65">{batch.date ?? 'Published slot batch'}</p>
                      </div>
                      <ArrowRight className="mt-1 h-5 w-5 text-white/35 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}

                {!batches.length && (
                  <div className="rounded-[1.4rem] border border-dashed border-white/15 bg-white/[0.02] p-4 text-sm text-white/55">
                    No published batches yet.
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </section>
      </main>
    </div>
  );
}