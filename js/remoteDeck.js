const MTGJSON_BASE = 'https://mtgjson.com/api/v5';
const DECK_LIST_URL = `${MTGJSON_BASE}/DeckList.json`;
const COMMANDER_TYPE = 'Commander Deck';
const MAX_RECENT_CANDIDATES = 100;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRIES = 2;
const ANY_DECK_TYPE = '__any__';

let deckListCache = null;

function toIsoDateSafe(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sortByReleaseDateDesc(a, b) {
  const da = toIsoDateSafe(a.releaseDate);
  const db = toIsoDateSafe(b.releaseDate);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return db - da;
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function fetchJsonWithRetry(url, { retries, timeoutMs, label }) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`${label} failed (${response.status}).`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error(`${label} failed.`);
}

function buildDeckText(deckData) {
  const sections = [
    deckData.commander,
    deckData.mainBoard,
    deckData.sideBoard,
    deckData.maybeboard,
  ];

  const counts = new Map();

  for (const section of sections) {
    if (!Array.isArray(section)) continue;
    for (const card of section) {
      const name = card?.name?.trim();
      const count = Number(card?.count ?? 1);
      if (!name || !Number.isFinite(count) || count <= 0) continue;
      counts.set(name, (counts.get(name) || 0) + Math.floor(count));
    }
  }

  if (!counts.size) {
    throw new Error('No usable cards in remote deck payload.');
  }

  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, count]) => `${count} ${name}`)
    .join('\n');
}

async function fetchDeckList({ retries, timeoutMs }) {
  if (deckListCache) return deckListCache;
  const payload = await fetchJsonWithRetry(DECK_LIST_URL, {
    retries,
    timeoutMs,
    label: 'Deck catalog fetch',
  });

  if (!payload?.data || !Array.isArray(payload.data)) {
    throw new Error('Deck catalog payload was not valid.');
  }

  deckListCache = payload.data;
  return deckListCache;
}

function pickDeckCandidate(deckList, deckType) {
  const candidates = deckList
    .filter(entry => entry?.fileName)
    .filter(entry => deckType === ANY_DECK_TYPE || entry?.type === deckType)
    .sort(sortByReleaseDateDesc);

  if (!candidates.length) {
    throw new Error(`No decks found for type: ${deckType}.`);
  }

  const pool = candidates.slice(0, MAX_RECENT_CANDIDATES);
  return randomItem(pool);
}

async function fetchDeckByFileName(fileName, { retries, timeoutMs }) {
  const url = `${MTGJSON_BASE}/decks/${encodeURIComponent(fileName)}.json`;
  const payload = await fetchJsonWithRetry(url, {
    retries,
    timeoutMs,
    label: `Deck fetch for ${fileName}`,
  });

  if (!payload?.data) {
    throw new Error('Remote deck payload was not valid.');
  }

  return { deckData: payload.data, sourceUrl: url };
}

export async function loadRandomWebDeck(options = {}) {
  const {
    deckType = COMMANDER_TYPE,
    retries = DEFAULT_RETRIES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const deckList = await fetchDeckList({ retries, timeoutMs });
  const picked = pickDeckCandidate(deckList, deckType);
  const { deckData, sourceUrl } = await fetchDeckByFileName(picked.fileName, { retries, timeoutMs });
  const deckText = buildDeckText(deckData);

  return {
    deckText,
    deckName: picked.name || picked.fileName,
    fileName: picked.fileName,
    deckType: picked.type || deckType,
    sourceUrl,
  };
}
