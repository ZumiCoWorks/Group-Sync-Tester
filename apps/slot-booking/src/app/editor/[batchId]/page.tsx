'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabase';
import BatchEditorScreen from '../../../components/batch-editor-screen';

interface PageProps {
  params: { batchId: string };
}

export default function EditBatchPage({ params }: PageProps) {
  const router = useRouter();
  const { batchId } = params;
  
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
        // Redirect unauthorized attempts back to home login natively
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
        <p className="text-sm">Loading batch editor sync…</p>
      </div>
    );
  }

  if (!authToken) return null;

  // Pass the required native authToken down to avoid compilation errors
  return <BatchEditorScreen mode="edit" batchId={batchId} authToken={authToken} />;
}