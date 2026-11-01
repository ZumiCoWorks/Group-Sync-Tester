import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AFDA Venue Booking',
  description: 'Ops workspace for managing venues, allocations, and conflicts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const continuumUrl = process.env.NEXT_PUBLIC_CONTINUUM_URL;
  return (
    <html lang="en">
      <body className="bg-[var(--bg)] text-[var(--text)] antialiased">
        <div className="continuum-module-bar">
          <div><span className="continuum-module-bar__mark">A</span><strong>AFDA Continuum</strong><span>Spaces &amp; Resources</span></div>
          {continuumUrl ? <a href={continuumUrl}>Return to Continuum</a> : <span>Continuum return URL not configured</span>}
        </div>
        {children}
      </body>
    </html>
  );
}
