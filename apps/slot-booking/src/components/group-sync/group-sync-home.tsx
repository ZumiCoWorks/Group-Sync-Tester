'use client';

import { Crown, ShieldCheck, Users, Zap, CalendarClock } from 'lucide-react';
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
    <div className="min-h-screen bg-background font-sans app-shell-bg">
      <div className="pointer-events-none absolute inset-0" />
      <Navbar />
      <main className="relative mx-auto max-w-7xl px-4 pb-14 pt-8 md:px-6 lg:px-8">
        <section className="app-panel p-6 md:p-10">
          <p className="app-pill inline-flex">AFDA App / Student Grouping</p>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-foreground md:text-7xl font-headline">
            Group students in
            <span className="text-primary"> real time</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-medium text-muted-foreground md:text-xl">
            Launch a room, let students join instantly, and shuffle balanced groups for seminar, lab, or critique sessions.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              onClick={createSession}
              disabled={isCreating || isUserLoading}
              size="lg"
              className="flex items-center justify-center gap-2 rounded-full px-8 py-6 text-base font-bold"
            >
              <Crown className="h-5 w-5" />
              {isCreating ? 'Creating...' : 'Host a Room'}
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-full px-8 py-6 text-base font-bold">
              <Link href="/join">Join as Student</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 py-6 text-base font-bold">
              <Link href="/demo">Try Demo</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8 py-6 text-base font-bold">
              <Link href="/slot-booking">
                <CalendarClock className="mr-2 h-4 w-4" />
                Open Slot Booking
              </Link>
            </Button>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="app-panel p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-headline text-lg font-bold text-foreground">Real-time Sync</h3>
            <p className="mt-2 text-sm text-muted-foreground">Students join instantly via short code. No refresh needed.</p>
          </div>
          <div className="app-panel p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="font-headline text-lg font-bold text-foreground">Classroom Ready</h3>
            <p className="mt-2 text-sm text-muted-foreground">Built for higher education timetables and teaching workflows.</p>
          </div>
          <div className="app-panel p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-headline text-lg font-bold text-foreground">Fast Exports</h3>
            <p className="mt-2 text-sm text-muted-foreground">Copy group lists quickly for attendance, LMS uploads, and archives.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
