import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthSessionProvider } from '@/components/auth/session-provider';

export const metadata: Metadata = {
  title: 'AFDA Workspace',
  description: 'Launch Group Sync, Worksuite, and other AFDA tools from a unified app directory.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('min-h-screen bg-background font-body text-foreground antialiased selection:bg-primary/20')}>
        <FirebaseClientProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
