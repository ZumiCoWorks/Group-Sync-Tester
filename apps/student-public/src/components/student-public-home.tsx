'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock3, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function StudentPublicHome() {
  const [batchId, setBatchId] = useState('');

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
              Batch ID first
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-4 sm:mt-6">
          <Card className="border-white/10 bg-[#111a26]/95 p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Open batch</p>
            <h2 className="mt-2 text-xl font-black text-white">Paste the batch ID</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">Use the batch link your tutor shared, or paste the batch ID here to open it directly.</p>

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
        </section>
      </main>
    </div>
  );
}