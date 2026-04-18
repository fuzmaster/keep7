const KEY_DECKLIST  = 'keep7_decklist';
const KEY_CACHE_PFX = 'keep7_cache_';
const KEY_CACHE_IDX = 'keep7_cache_idx';
const KEY_WEB_DECK_TYPE = 'keep7_web_deck_type';
const TTL_MS        = 7 * 24 * 60 * 60 * 1000;
const MAX_DECKS     = 5;

const ls = {
  get: k    => { try { return localStorage.getItem(k);    } catch { return null; } },
  set: (k,v)=> { 
    try { 
      localStorage.setItem(k, v);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing oldest cache');
        clearOldestCache();
        try { localStorage.setItem(k, v); } catch {}
      }
    }
  },
  del: k    => { try { localStorage.removeItem(k);        } catch {} },
};

function getIdx()    { try { return JSON.parse(ls.get(KEY_CACHE_IDX) || '[]'); } catch { return []; } }
function setIdx(arr) { ls.set(KEY_CACHE_IDX, JSON.stringify(arr)); }

function clearOldestCache() {
  const idx = getIdx();
  if (idx.length > 0) {
    const oldest = idx.shift();
    ls.del(KEY_CACHE_PFX + oldest);
    setIdx(idx);
  }
}

export function saveDecklist(text) { ls.set(KEY_DECKLIST, text); }
export function loadDecklist()     { return ls.get(KEY_DECKLIST); }
export function saveWebDeckType(value) { ls.set(KEY_WEB_DECK_TYPE, value); }
export function loadWebDeckType()      { return ls.get(KEY_WEB_DECK_TYPE); }

export function saveCardCacheByHash(hash, cardData) {
  const minimal = cardData.map(c => ({
    name:       c.name,
    type_line:  c.type_line,
    cmc:        c.cmc,
    mana_cost:  c.mana_cost,
    image_uris: c.image_uris
      ? { small: c.image_uris.small, normal: c.image_uris.normal }
      : undefined,
    card_faces: c.card_faces
      ? c.card_faces.map(f => ({
          mana_cost:  f.mana_cost,
          image_uris: f.image_uris
            ? { small: f.image_uris.small, normal: f.image_uris.normal }
            : undefined,
        }))
      : undefined,
  }));

  let idx = getIdx();
  if (!idx.includes(hash)) {
    if (idx.length >= MAX_DECKS) {
      const evicted = idx.shift();
      ls.del(KEY_CACHE_PFX + evicted);
    }
    idx.push(hash);
    setIdx(idx);
  }
  ls.set(KEY_CACHE_PFX + hash, JSON.stringify({ ts: Date.now(), data: minimal }));
}

export function loadCardCacheByHash(hash) {
  const raw = ls.get(KEY_CACHE_PFX + hash);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (Date.now() - p.ts < TTL_MS) return p.data;
    ls.del(KEY_CACHE_PFX + hash);
    setIdx(getIdx().filter(h => h !== hash));
    return null;
  } catch { return null; }
}

// Legacy no-ops so old call-sites don't break
export function saveCardCache() {}
export function loadCardCache()  { return null; }

export function clearStorage() {
  ls.del(KEY_DECKLIST);
  ls.del(KEY_WEB_DECK_TYPE);
  for (const h of getIdx()) ls.del(KEY_CACHE_PFX + h);
  ls.del(KEY_CACHE_IDX);
}