import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AFDA Booking Platform',
  description: 'Complete booking system for AFDA students and staff',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
