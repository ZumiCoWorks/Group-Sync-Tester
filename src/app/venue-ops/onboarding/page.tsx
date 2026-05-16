"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function VenueOpsOnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function requestAccess() {
    setMessage(null);

    const email = session?.user?.email?.trim();
    if (!email) {
      setMessage('Sign in first to request Venue Ops access.');
      return;
    }

    const res = await fetch('/api/roles/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role: 'operations' }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data?.error || 'Request failed');
      return;
    }

    setMessage('Venue Ops access requested. An admin can approve it from the admin queue.');
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-10">
      <div className="w-full rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-2xl shadow-amber-500/5 md:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Venue Ops onboarding</p>
        <h1 className="mt-3 text-3xl font-black text-foreground md:text-4xl">Request operational access</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          This lane is separate from slot-booking. Sign in with your work email and request access to Venue Ops if you manage venues, approvals, or lockouts.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-4">
          <p className="text-sm font-semibold text-foreground">Signed in as</p>
          <p className="mt-1 text-sm text-muted-foreground">{session?.user?.email ?? 'not signed in'}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {!session?.user?.email ? (
            <Button onClick={() => signIn(undefined, { callbackUrl: '/venue-ops/onboarding' })} className="rounded-full px-5">
              Sign in
            </Button>
          ) : (
            <Button onClick={requestAccess} className="rounded-full px-5">
              Request Venue Ops access
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push('/venue-ops')} className="rounded-full border-border px-5">
            Continue to Venue Ops
          </Button>
        </div>

        {message && <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>}
      </div>
    </div>
  );
}
