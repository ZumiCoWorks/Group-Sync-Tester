'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
        <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl">
          <CardHeader>
            <CardTitle className="text-3xl font-black font-headline text-foreground">Access Room</CardTitle>
            <CardDescription className="text-muted-foreground !mt-2 font-medium">
              Enter the 6-digit session code provided by your lecturer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="CODE01"
                className="w-full p-5 h-auto bg-secondary border-2 border-border rounded-2xl outline-none focus:border-primary font-mono text-3xl tracking-widest text-center uppercase text-foreground"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <Button
                type="submit"
                disabled={sessionId.length < 3}
                className="w-full py-6 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-lg"
              >
                ENTER LOBBY
              </Button>
              <Button variant="link" asChild className="w-full text-muted-foreground text-sm font-bold mt-2">
                <Link href="/group-sync">Cancel</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
