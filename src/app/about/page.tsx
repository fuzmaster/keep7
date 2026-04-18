import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — Keep7',
  description: 'Learn how Keep7 works, what metrics it tracks, and how your privacy is protected.',
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem', color: 'var(--text-primary)' }}>
      <Link href="/" style={{ color: 'var(--keep)', fontSize: '0.85rem', textDecoration: 'none' }}>
        ← Back to Keep7
      </Link>
      <h1 style={{ margin: '1.5rem 0 0.5rem', fontSize: '1.75rem' }}>About Keep7</h1>
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>What is Keep7?</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Keep7 is a free, instant MTG deck consistency tool. It lets you test opening hands,
          goldfish turns 1–5 with real mana tracking, and compare two decks head-to-head — all
          in your browser with zero signup required.
        </p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>How it works</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Your decklist is parsed locally, then card data is fetched from the Scryfall API.
          Shuffling uses a Fisher-Yates algorithm. All math — hypergeometric draw probabilities,
          keep/mull heuristics, mana curve analysis — runs entirely in your browser.
        </p>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Understanding the metrics</h2>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
          <li><strong>Keep Rate</strong> — % of opened hands deemed playable by heuristic</li>
          <li><strong>Avg Lands</strong> — Mean land count across all opened hands</li>
          <li><strong>T3 Land %</strong> — Probability of hitting a 3rd land drop by turn 3</li>
          <li><strong>Flood/Screw Risk</strong> — % of hands with 6+ or 0–1 lands</li>
        </ul>
      </section>
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Privacy</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Keep7 does not collect any personal data. Decklists are cached in your browser&apos;s
          localStorage. External APIs used: Scryfall (card data), MTGJSON (random decks),
          Moxfield &amp; Archidekt (deck import via server proxy).
        </p>
      </section>
    </main>
  );
}
