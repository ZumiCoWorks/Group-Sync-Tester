'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const PublicBatchBooking = dynamic(() => import('./public-batch-booking').then((m) => m.PublicBatchBooking), { ssr: false });

export default function PublicBatchWrapper({ batchId }: { batchId: string }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_36%),linear-gradient(180deg,_#f8fafc,_#ecfdf5)] py-8">
      <div className="mx-auto mb-6 flex w-full max-w-3xl items-center justify-between rounded-3xl border border-emerald-100 bg-white/90 px-5 py-4 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-emerald-700">AFDA Public Booking</p>
          <p className="mt-1 text-sm text-slate-600">Share-ready slot booking page for students.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-600">Batch {batchId.slice(-6)}</Badge>
          <Link href="/slot-booking" className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Booking hub
          </Link>
        </div>
      </div>
      <PublicBatchBooking batchId={batchId} />
    </div>
  );
}
