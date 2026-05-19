'use client';

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function AuthActions({ callbackUrl = '/' }: { callbackUrl?: string }) {
  const { data: session } = useSession();

  return session?.user ? (
    <Button variant="outline" className="rounded-full px-4" onClick={() => signOut({ callbackUrl })}>
      Logout
    </Button>
  ) : (
    <Button asChild variant="outline" className="rounded-full px-4">
      <Link href="/auth/signin">Login</Link>
    </Button>
  );
}