'use client';

import { AppFrame } from '@afda/continuum-ui';
import { usePathname } from 'next/navigation';
import { Suspense, type ReactNode } from 'react';
import { PersonaSwitcher } from './persona-switcher';

export function ContinuumFrame({ children, demoMode }: { children: ReactNode; demoMode: boolean }) {
  const tools = demoMode ? <Suspense fallback={<span className="continuum-persona-loading">Loading demo persona…</span>}><PersonaSwitcher /></Suspense> : undefined;
  return <AppFrame activePath={usePathname()} headerTools={tools}>{children}</AppFrame>;
}
