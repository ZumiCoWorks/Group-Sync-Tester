"use client";

import { Suspense, useMemo } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { listMockUsers } from '@/lib/mock-auth-provider';

const isMockMode = process.env.NODE_ENV !== 'production' || process.env.MOCK_AUTH_ENABLED === 'true';

function SignInPageContent() {
  let callbackUrl = '/';
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    callbackUrl = params.get('callbackUrl') || '/';
  }
  const mockUsers = useMemo(() => listMockUsers(), []);

  return (
    <div className="min-h-screen bg-[#0a0d14] px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Card className="border-white/10 bg-[#111522]/95 p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl md:p-8">
          <p className="text-xs uppercase tracking-[0.34em] text-white/45">AFDA Workspace</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Sign in</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
            Use a local demo identity to browse the workspace without Azure sign-in.
          </p>

          {isMockMode ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {mockUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  onClick={() => signIn('credentials', { email: user.email, callbackUrl })}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
                >
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/45">Mock account</p>
                  <p className="mt-2 text-lg font-bold text-white">{user.name}</p>
                  <p className="mt-1 text-sm text-white/60">{user.email}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <Button
                onClick={() => signIn('azure-ad', { callbackUrl })}
                className="rounded-full bg-white px-6 py-6 text-slate-950 hover:bg-white/90"
              >
                Sign in with Azure AD
              </Button>
            </div>
          )}
        </Card>

        <Card className="border-white/10 bg-white/[0.04] p-5 text-white/70 backdrop-blur-xl">
          <p className="text-sm leading-6">
            Mock auth is active in development. Lecturer and tutor demo accounts go straight into the booking lanes, and student demo accounts open the student booking flow.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0d14]" />}>
      <SignInPageContent />
    </Suspense>
  );
}