// FNV-1a 32-bit hash — fast, good distribution for deck cache keys
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

export function deckHash(text) {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  return 'k7_' + fnv1a(normalized);
}
