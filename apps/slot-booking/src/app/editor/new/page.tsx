'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabase';
import BatchEditorScreen from '../../../components/batch-editor-screen';

export default function NewBatchPage() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setChecking(false);
        router.push('/');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        setAuthToken(session.access_token);
      }
      setChecking(false);
    };
    void checkAuth();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-200">
        <p className="text-sm">Loading secure workspace context…</p>
      </div>
    );
  }

  if (!authToken) return null;

  return <BatchEditorScreen mode="create" authToken={authToken} />;
}