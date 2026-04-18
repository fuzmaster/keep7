/** FNV-1a 32-bit hash → base-36 string with prefix. */
export function deckHash(text: string): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  let h = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return 'k7_' + h.toString(36);
}
