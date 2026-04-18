import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Keep7 — MTG Deck Consistency Lab',
  description: 'Test opening hands, goldfish turns 1–5, and compare two decks side-by-side. Free, instant, no signup.',
  openGraph: {
    title: 'Keep7 — MTG Deck Consistency Lab',
    description: 'Test MTG opening hands, goldfish, and compare decks.',
    url: 'https://keep7.vercel.app',
    siteName: 'Keep7',
    type: 'website',
  },
  icons: {
    icon: '/favicon-card.svg',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
