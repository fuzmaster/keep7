const IGNORE_LINE = /^(Commander|Sideboard|Maybeboard|Deck|Companion)\s*$/i;
const LINE_RE = /^(\d+)\s+(.+)/;

export function getFrontFaceName(name) {
  return name.includes('//') ? name.split('//')[0].trim() : name;
}

export function parseDecklist(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const cardMap = new Map();
  const errors = [];

  for (const raw of lines) {
    if (IGNORE_LINE.test(raw)) {
      continue;
    }

    let cleaned = raw
      .replace(/^\*?\s*/, '')
      .replace(/^SB:\s*/i, '')
      .replace(/\t+/g, ' ')
      .trim();

    cleaned = cleaned.split(/\s*[(\[]/)[0].trim();
    cleaned = cleaned.replace(/\s+#\S+/g, '').trim();

    const match = cleaned.match(LINE_RE);
    if (match) {
      const qty = Number.parseInt(match[1], 10);
      const name = match[2].trim();
      cardMap.set(name, (cardMap.get(name) || 0) + qty);
      continue;
    }

    if (cleaned.length > 0) {
      errors.push(raw);
    }
  }

  return { cardMap, errors };
}
