import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TIMEGRAPH — Horological Watch Wishlist & Autonomous Price Tracker',
  description:
    'A personal luxury mechanical watch movement wishlist. Paste a link to auto-scrape specs, track real-time price drops & restocks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-dial-950 text-slate-100 antialiased selection:bg-gold-500/30 selection:text-gold-200">
        {children}
      </body>
    </html>
  );
}
