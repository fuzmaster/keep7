export function isLand(card) {
  return /\bLand\b/i.test(card.type_line || '');
}

export function landCountFromDeck(deck) {
  return deck.filter(isLand).length;
}

// Evaluate a 7-card opening hand
export function evalHand(hand) {
  const landCount  = hand.filter(isLand).length;
  const spellCount = hand.length - landCount;
  const earlySpells = hand.filter(c => !isLand(c) && (c.cmc ?? 99) <= 2).length;

  let keep = 'risky';
  if (landCount >= 2 && landCount <= 5 && spellCount >= 1) keep = 'keepable';
  if (landCount === 2 && spellCount >= 5)                  keep = 'marginal';
  if (landCount >= 6)                                       keep = 'flood';
  if (landCount <= 1)                                       keep = 'screw';

  return { landCount, spellCount, earlySpells, keep };
}

// Hypergeometric: P(at least 1 land drawn in `draws` draws)
export function pLandInDraws(remainingLands, librarySize, draws) {
  if (librarySize <= 0 || draws <= 0 || remainingLands <= 0) return 0;
  const nonLands = librarySize - remainingLands;
  if (nonLands <= 0) return 100;

  let pNone = 1;
  for (let i = 0; i < Math.min(draws, librarySize); i++) {
    const n = nonLands - i;
    if (n <= 0) { pNone = 0; break; }
    pNone *= n / (librarySize - i);
  }
  return Math.round((1 - pNone) * 100);
}

// Session-level stats from array of { landCount, wasKept }
export function computeSessionStats(samples) {
  const empty = { keeps: 0, mulls: 0, keepRate: 0, avgLands: '—', twoLandPct: 0, threeLandPct: 0, openers: 0 };
  const n = samples.length;
  if (!n) return empty;

  const keeps = samples.filter(s => s.wasKept).length;
  const avgLands    = (samples.reduce((a, s) => a + s.landCount, 0) / n).toFixed(1);
  const twoLandPct  = Math.round(samples.filter(s => s.landCount === 2).length / n * 100);
  const threeLandPct = Math.round(samples.filter(s => s.landCount === 3).length / n * 100);
  const keepRate    = Math.round(keeps / n * 100);

  return { keeps, mulls: n - keeps, keepRate, avgLands, twoLandPct, threeLandPct, openers: n };
}

const LABELS = {
  keepable: { text: 'Playable',    cls: 'keep' },
  marginal: { text: 'Marginal',    cls: 'gold' },
  flood:    { text: 'Flood Risk',  cls: 'mull' },
  screw:    { text: 'Mana Screw',  cls: 'mull' },
  risky:    { text: 'Risky',       cls: 'gold' },
};

export function keepLabel(ev) {
  return LABELS[ev.keep] || { text: 'Unknown', cls: 'muted' };
}