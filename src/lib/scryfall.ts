import type { Card, ScryfallCollectionResponse } from '@/types/card';
import { getFrontFaceName } from './parser';

const CHUNK_SIZE = 75;
const THROTTLE_MS = 150;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_RETRIES = 2;

type ErrorCode = 'RATE_LIMITED' | 'SERVER_ERROR' | 'TIMEOUT' | 'NETWORK' | 'HTTP_ERROR';

class ScryfallError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function stripCard(c: Card): Card {
  return {
    name: c.name,
    type_line: c.type_line,
    cmc: c.cmc,
    mana_cost: c.mana_cost,
    image_uris: c.image_uris,
    card_faces: c.card_faces,
  };
}

async function fetchChunk(
  identifiers: { name: string }[],
  attempt = 0,
): Promise<ScryfallCollectionResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers }),
      signal: controller.signal,
    });

    if (res.status === 429) {
      if (attempt < MAX_RETRIES) { await delay(2000); return fetchChunk(identifiers, attempt + 1); }
      throw new ScryfallError('RATE_LIMITED', 'Scryfall rate limit');
    }
    if (res.status >= 500) {
      if (attempt < MAX_RETRIES) { await delay(800 * (attempt + 1)); return fetchChunk(identifiers, attempt + 1); }
      throw new ScryfallError('SERVER_ERROR', `Scryfall ${res.status}`);
    }
    if (!res.ok) throw new ScryfallError('HTTP_ERROR', `HTTP ${res.status}`);

    return (await res.json()) as ScryfallCollectionResponse;
  } catch (err) {
    if (err instanceof ScryfallError) throw err;
    if ((err as Error).name === 'AbortError') {
      if (attempt < MAX_RETRIES) { await delay(600 * (attempt + 1)); return fetchChunk(identifiers, attempt + 1); }
      throw new ScryfallError('TIMEOUT', 'Request timed out');
    }
    if (attempt < MAX_RETRIES) { await delay(600 * (attempt + 1)); return fetchChunk(identifiers, attempt + 1); }
    throw new ScryfallError('NETWORK', (err as Error).message);
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCards(
  cardNames: string[],
  onProgress?: (loaded: number, total: number) => void,
): Promise<Card[]> {
  const unique = [...new Set(cardNames.map(n => getFrontFaceName(n)))];
  const chunks: { name: string }[][] = [];

  for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
    chunks.push(unique.slice(i, i + CHUNK_SIZE).map(name => ({ name })));
  }

  const results: Card[] = [];
  let loaded = 0;

  for (const chunk of chunks) {
    const res = await fetchChunk(chunk);
    results.push(...res.data.map(stripCard));
    loaded += chunk.length;
    onProgress?.(loaded, unique.length);
    if (chunks.indexOf(chunk) < chunks.length - 1) await delay(THROTTLE_MS);
  }

  return results;
}
