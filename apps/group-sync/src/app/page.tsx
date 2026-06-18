'use client';

import { Crown, ShieldCheck, Users, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  const createSession = async () => {
    setIsCreating(true);
    setError('');

    try {
      const response = await fetch(`${backendUrl}/api/group-sync/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Group Sync Session',
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || 'Failed to create session');
      }

      const sessionCode = result.data.code;
      router.push(`/room/${sessionCode}?host=true`);
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.message || 'Connection error. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 pt-20 text-center">
        <h1 className="text-6xl md:text-8xl font-black font-headline text-foreground tracking-tighter mb-6">
          Group students <br />
          <span className="text-emerald-500">effortlessly.</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-12">
          A high-performance live grouping tool designed for seminars, labs, and collaborative lectures.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={createSession}
            disabled={isCreating}
            size="lg"
            className="w-full sm:w-auto px-10 py-7 bg-foreground text-background rounded-full font-bold text-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 shadow-2xl"
          >
            <Crown className="w-5 h-5 text-emerald-400" /> {isCreating ? 'Creating...' : 'Host a Room'}
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto px-10 py-7 bg-transparent text-foreground border-2 border-foreground rounded-full font-bold text-lg hover:bg-foreground/5 transition-all"
          >
            <Link href="/join">Join as Student</Link>
          </Button>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t pt-12">
          <div>
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground font-headline">Real-time Sync</h3>
            <p className="text-muted-foreground text-sm">Students join instantly via QR or short code. No refresh needed.</p>
          </div>
          <div>
            <div className="w-10 h-10 bg-teal-500/10 text-teal-500 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground font-headline">Varsity Ready</h3>
            <p className="text-muted-foreground text-sm">Clean, professional UI suitable for higher education environments.</p>
          </div>
          <div>
            <div className="w-10 h-10 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground font-headline">One-Click Export</h3>
            <p className="text-muted-foreground text-sm">Copy group lists directly to clipboard for attendance or LMS.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
