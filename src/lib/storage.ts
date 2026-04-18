import type { Card } from '@/types/card';

const KEY_DECKLIST = 'keep7_decklist';
const KEY_CACHE_PFX = 'keep7_cache_';
const KEY_CACHE_IDX = 'keep7_cache_idx';
const KEY_WEB_DECK_TYPE = 'keep7_web_deck_type';
const FIRST_RUN_KEY = 'keep7_first_run_complete';
const MAX_CACHED_DECKS = 5;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function safe<T>(fn: () => T, fallback: T): T {
  try { return fn(); } catch { return fallback; }
}

export function saveDecklist(text: string): void {
  safe(() => localStorage.setItem(KEY_DECKLIST, text), undefined);
}

export function loadDecklist(): string | null {
  return safe(() => localStorage.getItem(KEY_DECKLIST), null);
}

export function saveCardCacheByHash(hash: string, cardData: Card[]): void {
  safe(() => {
    const stripped = cardData.map(c => ({
      name: c.name, type_line: c.type_line, cmc: c.cmc, mana_cost: c.mana_cost,
      image_uris: c.image_uris, card_faces: c.card_faces,
    }));
    const entry = JSON.stringify({ ts: Date.now(), data: stripped });

    try {
      localStorage.setItem(KEY_CACHE_PFX + hash, entry);
    } catch {
      evictOldest();
      localStorage.setItem(KEY_CACHE_PFX + hash, entry);
    }

    const idx: string[] = JSON.parse(localStorage.getItem(KEY_CACHE_IDX) ?? '[]');
    const filtered = idx.filter(h => h !== hash);
    filtered.push(hash);
    while (filtered.length > MAX_CACHED_DECKS) {
      const old = filtered.shift()!;
      localStorage.removeItem(KEY_CACHE_PFX + old);
    }
    localStorage.setItem(KEY_CACHE_IDX, JSON.stringify(filtered));
  }, undefined);
}

export function loadCardCacheByHash(hash: string): Card[] | null {
  return safe(() => {
    const raw = localStorage.getItem(KEY_CACHE_PFX + hash);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(KEY_CACHE_PFX + hash);
      return null;
    }
    return data as Card[];
  }, null);
}

function evictOldest(): void {
  const idx: string[] = JSON.parse(localStorage.getItem(KEY_CACHE_IDX) ?? '[]');
  if (idx.length > 0) {
    const old = idx.shift()!;
    localStorage.removeItem(KEY_CACHE_PFX + old);
    localStorage.setItem(KEY_CACHE_IDX, JSON.stringify(idx));
  }
}

export function saveWebDeckType(value: string): void {
  safe(() => localStorage.setItem(KEY_WEB_DECK_TYPE, value), undefined);
}

export function loadWebDeckType(): string | null {
  return safe(() => localStorage.getItem(KEY_WEB_DECK_TYPE), null);
}

export function isFirstRun(): boolean {
  return safe(() => !localStorage.getItem(FIRST_RUN_KEY), true);
}

export function markFirstRunComplete(): void {
  safe(() => localStorage.setItem(FIRST_RUN_KEY, '1'), undefined);
}

export function clearStorage(): void {
  safe(() => {
    const idx: string[] = JSON.parse(localStorage.getItem(KEY_CACHE_IDX) ?? '[]');
    for (const h of idx) localStorage.removeItem(KEY_CACHE_PFX + h);
    localStorage.removeItem(KEY_CACHE_IDX);
    localStorage.removeItem(KEY_DECKLIST);
    localStorage.removeItem(KEY_WEB_DECK_TYPE);
  }, undefined);
}
