const IGNORE_LINE = /^(Commander|Sideboard|Maybeboard|Deck|Companion)\s*$/i;
const LINE_RE = /^(\d+)x?\s+(.+)$/i;

function normalizeCardName(rawName) {
  // Moxfield export suffixes can include set code + collector number.
  let name = rawName
    .replace(/\s+/g, ' ')
    .replace(/\s+#\S+$/g, '')
    .trim();

  // Keep only the literal card name by cutting at the first set/annotation delimiter.
  // Limit splits to prevent DoS from massively nested inputs
  const parts = name.split(/[\[(]/, 1);
  name = parts[0].trim();

  // For double-faced cards, limit to 2 parts
  if (name.includes('//')) {
    const faceParts = name.split('//').slice(0, 2);
    name = faceParts[0].trim();
  }

  return name;
}

export function getFrontFaceName(name) {
  if (!name.includes('//')) return name;
  // Limit splits to first two parts to prevent DoS
  const parts = name.split('//').slice(0, 2);
  return parts[0].trim();
}

export function parseDecklist(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const cardMap = new Map();
  const errors = [];

  for (const raw of lines) {
    if (IGNORE_LINE.test(raw)) {
      continue;
    }

    if (/^SB:\s*/i.test(raw)) {
      continue;
    }

    let cleaned = raw
      .replace(/^\*?\s*/, '')
      .replace(/\t+/g, ' ')
      .trim();

    const match = cleaned.match(LINE_RE);
    if (match) {
      const qty = Number.parseInt(match[1], 10);
      const name = normalizeCardName(match[2]);
      if (!name) {
        errors.push(raw);
        continue;
      }
      cardMap.set(name, (cardMap.get(name) || 0) + qty);
      continue;
    }

    if (cleaned.length > 0) {
      errors.push(raw);
    }
  }

  return { cardMap, errors };
}
