'use client';

import { Crown, ShieldCheck, Users, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase';

export default function Home() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSigningIn(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) setError(signInError.message);
    setIsSigningIn(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setError('');
  };

  const createSession = async () => {
    setIsCreating(true);
    setError('');

    try {
      if (!session?.access_token) {
        throw new Error('Sign in with an approved staff account before hosting a room.');
      }
      const response = await fetch(`${backendUrl}/api/group-sync/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
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
        <h1 className="text-6xl md:text-8xl font-black font-headline text-heading tracking-tighter mb-6">
          Group students <br />
          <span className="text-accent-creative">effortlessly.</span>
        </h1>
        <p className="text-body text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-12">
          A high-performance live grouping tool designed for seminars, labs, and collaborative lectures.
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-accent-creative/10 border border-accent-creative/30 text-accent-creative text-sm max-w-md mx-auto">
            {error}
          </div>
        )}

        {authReady && !session ? (
          <form onSubmit={signIn} className="mx-auto mb-8 max-w-md space-y-3 rounded-3xl border border-muted bg-card p-5 text-left shadow-sm">
            <div>
              <h2 className="font-headline text-xl font-bold text-heading">Staff sign-in</h2>
              <p className="mt-1 text-sm text-body">Hosting and managing rooms requires an approved AFDA staff account.</p>
            </div>
            <label className="block text-sm font-semibold text-heading" htmlFor="host-email">Email</label>
            <input id="host-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-heading" />
            <label className="block text-sm font-semibold text-heading" htmlFor="host-password">Password</label>
            <input id="host-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-xl border border-muted bg-background px-4 py-3 text-heading" />
            <Button type="submit" disabled={isSigningIn} className="w-full rounded-xl bg-heading text-white">
              {isSigningIn ? 'Signing in…' : 'Sign in to host'}
            </Button>
          </form>
        ) : null}

        {session ? (
          <div className="mb-6 flex items-center justify-center gap-3 text-sm text-body">
            <span>Signed in as {session.user.email}</span>
            <button type="button" onClick={signOut} className="font-semibold text-accent-creative underline">Sign out</button>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={createSession}
            disabled={isCreating || !session}
            size="lg"
            className="w-full sm:w-auto px-10 py-7 bg-accent-creative text-white rounded-full font-bold text-lg hover:bg-accent-creative/90 transition-all flex items-center justify-center gap-3 shadow-2xl"
          >
            <Crown className="w-5 h-5 text-white" /> {isCreating ? 'Creating...' : 'Host a Room'}
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto px-10 py-7 bg-transparent text-heading border-2 border-heading rounded-full font-bold text-lg hover:bg-heading/5 transition-all"
          >
            <Link href="/join">Join as Student</Link>
          </Button>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t border-muted pt-12">
          <div>
            <div className="w-10 h-10 bg-accent-creative/10 text-accent-creative rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-heading font-headline text-lg">Real-time Sync</h3>
            <p className="text-body text-sm mt-1">Students join instantly via QR or short code. No refresh needed.</p>
          </div>
          <div>
            <div className="w-10 h-10 bg-accent-business/10 text-accent-business rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-heading font-headline text-lg">Varsity Ready</h3>
            <p className="text-body text-sm mt-1">Clean, professional UI suitable for higher education environments.</p>
          </div>
          <div>
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-heading font-headline text-lg">One-Click Export</h3>
            <p className="text-body text-sm mt-1">Copy group lists directly to clipboard for attendance or LMS.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
