import React from 'react';
import type { ReactNode } from 'react';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="AFDA Booking Platform - Student" />
        <title>AFDA Booking</title>
      </head>
      <body className="bg-primary text-heading antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(225,29,72,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.05),_transparent_30%)]">
          <header className="border-b border-muted bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-creative">AFDA</p>
                <h1 className="text-2xl font-bold text-heading">Booking</h1>
              </div>
              <div className="rounded-full border border-muted bg-secondary px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-body">
                Student portal
              </div>
            </div>
          </header>
          <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
