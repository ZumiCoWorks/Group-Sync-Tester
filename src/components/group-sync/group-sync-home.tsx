'use client';

import { Crown, ShieldCheck, Users, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useState } from 'react';

const appId = process.env.NEXT_PUBLIC_APP_ID || 'varsity-group-pro';

export function GroupSyncHome() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isCreating, setIsCreating] = useState(false);

  const createSession = () => {
    if (!db || !user) return;
    setIsCreating(true);
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const sessionRef = doc(db, 'artifacts', appId, 'public', 'data', 'sessions', newId);

    const sessionData = {
      id: newId,
      hostId: user.uid,
      status: 'lobby',
      createdAt: Date.now(),
      groups: [],
    };

    setDoc(sessionRef, sessionData)
      .then(() => {
        router.push(`/room/${newId}?host=true`);
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: sessionRef.path,
          operation: 'create',
          requestResourceData: sessionData,
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsCreating(false);
      });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pt-20 text-center">
        <h1 className="mb-6 text-6xl font-black tracking-tighter text-foreground md:text-8xl font-headline">
          Group students <br />
          <span className="text-primary">effortlessly.</span>
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-xl font-medium text-muted-foreground md:text-2xl">
          A high-performance live grouping tool designed for seminars, labs, and collaborative lectures.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            onClick={createSession}
            disabled={isCreating || isUserLoading}
            size="lg"
            className="flex w-full items-center justify-center gap-3 rounded-full bg-foreground px-10 py-7 text-lg font-bold text-background shadow-2xl shadow-slate-200 transition-all hover:bg-foreground/90 dark:shadow-slate-900 sm:w-auto"
          >
            <Crown className="h-5 w-5 text-primary" /> {isCreating ? 'Creating...' : 'Host a Room'}
          </Button>
          <Button
            asChild
            size="lg"
            className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-10 py-7 text-lg font-bold text-white shadow-2xl transition-all hover:from-purple-600 hover:to-pink-600 sm:w-auto"
          >
            <Link href="/demo" className="flex items-center justify-center gap-3">
              <Sparkles className="h-5 w-5" />
              Try Demo
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full rounded-full border-2 border-foreground bg-transparent px-10 py-7 text-lg font-bold text-foreground transition-all hover:bg-foreground/5 sm:w-auto"
          >
            <Link href="/join">Join as Student</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full rounded-full border-2 border-foreground bg-transparent px-10 py-7 text-lg font-bold text-foreground transition-all hover:bg-foreground/5 sm:w-auto"
          >
            <Link href="/worksuite">Open AFDA Worksuite</Link>
          </Button>
        </div>

        <div className="mt-24 grid grid-cols-1 gap-8 border-t pt-12 text-left md:grid-cols-3">
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-headline font-bold text-foreground">Real-time Sync</h3>
            <p className="text-sm text-muted-foreground">Students join instantly via QR or short code. No refresh needed.</p>
          </div>
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-headline font-bold text-foreground">Varsity Ready</h3>
            <p className="text-sm text-muted-foreground">Clean, professional UI suitable for higher education environments.</p>
          </div>
          <div>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-headline font-bold text-foreground">One-Click Export</h3>
            <p className="text-sm text-muted-foreground">Copy group lists directly to clipboard for attendance or LMS.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
