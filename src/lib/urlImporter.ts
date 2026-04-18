import type { DeckSource, ImportedDeck } from '@/types/card';

const MOXFIELD_RE = /moxfield\.com\/decks\/([A-Za-z0-9_-]+)/;
const ARCHIDEKT_RE = /archidekt\.com\/decks\/(\d+)/;

export function detectSource(url: string): { source: DeckSource; id: string } | null {
  const mox = MOXFIELD_RE.exec(url);
  if (mox) return { source: 'moxfield', id: mox[1] };

  const arch = ARCHIDEKT_RE.exec(url);
  if (arch) return { source: 'archidekt', id: arch[1] };

  return null;
}

export async function importFromUrl(url: string): Promise<ImportedDeck> {
  const detected = detectSource(url);
  if (!detected) throw new Error('Unrecognized deck URL. Supported: Moxfield, Archidekt.');

  const res = await fetch(`/api/import/${detected.source}?id=${encodeURIComponent(detected.id)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `Failed to import from ${detected.source} (${res.status})`);
  }

  return (await res.json()) as ImportedDeck;
}
