import type { Metadata } from 'next';
import { Cinzel } from 'next/font/google';
import { Footer } from '@/components/Footer';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Keep7 — MTG Deck Testing Tool',
  description: 'Test Magic: The Gathering opening hands, goldfish turns 1–5, and compare two decks side by side. Free, instant, no account needed. Works on mobile.',
  keywords: [
    'MTG deck tester', 'Magic the Gathering', 'opening hand simulator',
    'goldfish MTG', 'deck consistency', 'Commander deck testing',
    'MTG hand test', 'mulligan helper', 'deck race', 'Scryfall',
  ],
  openGraph: {
    title: 'Keep7 — MTG Deck Testing Tool',
    description: 'Test MTG opening hands, goldfish turns 1–5, and compare two decks side by side. Free and instant — no account needed.',
    url: 'https://keep7.vercel.app',
    siteName: 'Keep7',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Keep7 — MTG Deck Testing Tool',
    description: 'Test MTG opening hands, goldfish, and compare decks. Free, instant, no signup.',
  },
  icons: {
    icon: '/favicon-card.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cinzel.variable}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
