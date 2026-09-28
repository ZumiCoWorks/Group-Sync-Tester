import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const continuumSans = localFont({
  src: '../../../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2',
  display: 'swap',
  variable: '--font-continuum',
});

export const metadata: Metadata = {
  title: 'Continuum | AFDA',
  description: 'AFDA learning workspace platform',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={continuumSans.variable}>{children}</body></html>;
}
