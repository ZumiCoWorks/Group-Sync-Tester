import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AFDA Venue Booking',
  description: 'Ops workspace for managing venues, allocations, and conflicts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[var(--bg)] text-[var(--text)] antialiased">{children}</body>
    </html>
  );
}
