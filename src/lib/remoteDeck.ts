import type { RemoteDeckResult } from '@/types/card';

const MTGJSON_BASE = 'https://mtgjson.com/api/v5';
const DECK_LIST_URL = `${MTGJSON_BASE}/DeckList.json`;
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const MAX_RECENT_CANDIDATES = 100;

interface DeckCatalogEntry {
  name: string;
  fileName: string;
  type: string;
  releaseDate: string;
}

interface DeckDataCard {
  name: string;
  count: number;
}

interface DeckDataResponse {
  data: {
    commander?: DeckDataCard[];
    mainBoard?: DeckDataCard[];
    sideBoard?: DeckDataCard[];
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, attempt = 0): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      if (attempt < MAX_RETRIES) { await delay(800 * (attempt + 1)); return fetchWithRetry(url, attempt + 1); }
      throw new Error(`HTTP ${res.status}`);
    }
    return res;
  } catch (err) {
    if (attempt < MAX_RETRIES && !(err instanceof Error && err.message.startsWith('HTTP'))) {
      await delay(600 * (attempt + 1));
      return fetchWithRetry(url, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function loadRandomWebDeck(
  options: { deckType?: string } = {},
): Promise<RemoteDeckResult> {
  const { deckType = '__any__' } = options;

  const catalogRes = await fetchWithRetry(DECK_LIST_URL);
  const catalog: DeckCatalogEntry[] = await catalogRes.json();

  const filtered = deckType === '__any__'
    ? catalog
    : catalog.filter(d => d.type === deckType);

  if (filtered.length === 0) throw new Error('NO_DECKS_FOR_TYPE');

  filtered.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  const candidates = filtered.slice(0, MAX_RECENT_CANDIDATES);
  const pick = candidates[Math.floor(Math.random() * candidates.length)];

  const deckRes = await fetchWithRetry(`${MTGJSON_BASE}/decks/${pick.fileName}`);
  const deckJson: DeckDataResponse = await deckRes.json();

  const allCards = new Map<string, number>();
  for (const section of [deckJson.data.commander, deckJson.data.mainBoard]) {
    if (!section) continue;
    for (const c of section) {
      allCards.set(c.name, (allCards.get(c.name) ?? 0) + c.count);
    }
  }

  const lines = [...allCards.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, qty]) => `${qty} ${name}`);

  return {
    deckText: lines.join('\n'),
    deckName: pick.name,
    fileName: pick.fileName,
    deckType: pick.type,
    sourceUrl: `${MTGJSON_BASE}/decks/${pick.fileName}`,
  };
}
