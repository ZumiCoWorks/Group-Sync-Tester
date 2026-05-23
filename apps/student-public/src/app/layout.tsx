import React from 'react';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AFDA Booking Platform - Student" />
        <title>AFDA Booking</title>
      </head>
      <body className="bg-[#0f172a] text-slate-100 antialiased">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
