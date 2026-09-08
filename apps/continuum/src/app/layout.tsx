import type { Metadata } from 'next';
import './globals.css';
import { ContinuumFrame } from '@/components/continuum-frame';

export const metadata: Metadata = {
  title: 'AFDA Continuum · POC',
  description: 'AFDA production-venture platform proof of concept',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const demoMode = process.env.NEXT_PUBLIC_CONTINUUM_DEMO_MODE === 'true';
  return <html lang="en"><body><ContinuumFrame demoMode={demoMode}>{children}</ContinuumFrame></body></html>;
}
