'use client';

import { Crown, ShieldCheck, Terminal, Users, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useState } from 'react';

const appId = process.env.NEXT_PUBLIC_APP_ID || 'varsity-group-pro';

export default function Home() {
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
      <main className="max-w-4xl mx-auto px-4 pt-20 text-center">
        <h1 className="text-6xl md:text-8xl font-black font-headline text-foreground tracking-tighter mb-6">
          Group students <br />
          <span className="text-primary">effortlessly.</span>
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-12">
          A high-performance live grouping tool designed for seminars, labs, and collaborative lectures.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={createSession}
            disabled={isCreating || isUserLoading}
            size="lg"
            className="w-full sm:w-auto px-10 py-7 bg-foreground text-background rounded-full font-bold text-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 dark:shadow-slate-900"
          >
            <Crown className="w-5 h-5 text-primary" /> {isCreating ? 'Creating...' : 'Host a Room'}
          </Button>
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto px-10 py-7 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-2xl"
          >
            <Link href="/demo" className="flex items-center justify-center gap-3">
              <Sparkles className="w-5 h-5" />
              Try Demo
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto px-10 py-7 bg-transparent text-foreground border-2 border-foreground rounded-full font-bold text-lg hover:bg-foreground/5 transition-all"
          >
            <Link href="/join">Join as Student</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto px-10 py-7 bg-transparent text-foreground border-2 border-foreground rounded-full font-bold text-lg hover:bg-foreground/5 transition-all"
          >
            <Link href="/worksuite">Open AFDA Worksuite</Link>
          </Button>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left border-t pt-12">
          <div>
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground font-headline">Real-time Sync</h3>
            <p className="text-muted-foreground text-sm">Students join instantly via QR or short code. No refresh needed.</p>
          </div>
          <div>
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center mb-4">
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
