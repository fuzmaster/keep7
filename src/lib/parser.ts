const IGNORE_LINE = /^(Commander|Sideboard|Maybeboard|Deck|Companion)\s*$/i;
const LINE_RE = /^(\d+)x?\s+(.+)$/i;

function normalizeCardName(rawName: string): string {
  let name = rawName
    .replace(/^\*+/, '')
    .replace(/\t/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const bracketIdx = name.search(/[\[(]/);
  if (bracketIdx > 0) name = name.slice(0, bracketIdx).trim();
  return name;
}

export function getFrontFaceName(name: string): string {
  const idx = name.indexOf(' // ');
  return idx > 0 ? name.slice(0, idx).trim() : name;
}

export function parseDecklist(text: string): { cardMap: Map<string, number>; errors: string[] } {
  const cardMap = new Map<string, number>();
  const errors: string[] = [];

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || IGNORE_LINE.test(line) || line.startsWith('SB:')) continue;

    const m = LINE_RE.exec(line);
    if (!m) {
      errors.push(line);
      continue;
    }

    const qty = parseInt(m[1], 10);
    const name = normalizeCardName(m[2]);
    if (!name) { errors.push(line); continue; }

    cardMap.set(name, (cardMap.get(name) ?? 0) + qty);
  }

  return { cardMap, errors };
}
