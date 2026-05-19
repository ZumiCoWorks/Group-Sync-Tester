"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [role, setRole] = useState<'lecturer' | 'tutor'>('lecturer');
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setMessage(null);
    if (!session?.user?.email) return setMessage('Not authenticated');

    const r = await fetch('/api/roles/assign-self', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (r.ok) {
      router.push(role === 'lecturer' ? '/slot-booking/lecturer' : '/slot-booking/tutor');
    } else {
      const d = await r.json();
      setMessage(d?.error || 'Failed to assign');
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Staff Onboarding</h2>
      <p className="mt-2 text-sm text-muted-foreground">Choose your role for the booking app. Operations lives in Venue Ops now.</p>
      <div className="mt-4 space-y-3">
        <label className="block">
          <input type="radio" name="role" value="lecturer" checked={role === 'lecturer'} onChange={() => setRole('lecturer')} /> Lecturer
        </label>
        <label className="block">
          <input type="radio" name="role" value="tutor" checked={role === 'tutor'} onChange={() => setRole('tutor')} /> Tutor
        </label>
      </div>
      <div className="mt-4">
        <Button onClick={submit}>Continue</Button>
      </div>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
