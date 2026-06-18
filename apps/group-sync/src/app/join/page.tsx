'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';

export default function JoinInputPage() {
  const [sessionId, setSessionId] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.length > 2) {
      router.push(`/room/${sessionId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-muted bg-white p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-semibold text-heading">Access Room</h2>
            <p className="text-sm leading-6 text-body mt-2">
              Enter the 6-digit session code provided by your lecturer.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="text"
              placeholder="CODE01"
              className="w-full p-5 h-auto bg-secondary border border-muted rounded-2xl outline-none focus:border-accent-creative font-mono text-3xl tracking-widest text-center uppercase text-heading"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <Button
              type="submit"
              disabled={sessionId.length < 3}
              className="w-full py-4 bg-accent-creative text-white font-semibold rounded-2xl hover:bg-accent-creative/90 transition-all shadow-md shadow-accent-creative/10 text-lg disabled:opacity-50"
            >
              ENTER LOBBY
            </Button>
            <Button variant="link" asChild className="w-full text-body text-sm font-semibold hover:text-heading mt-2">
              <Link href="/">Cancel</Link>
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
