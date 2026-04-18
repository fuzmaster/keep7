import type { Card, HandEval, KeepVerdict, KeepLabelResult, OpenerSample, SessionStats } from '@/types/card';

export function isLand(card: Card): boolean {
  return /\bLand\b/i.test(card.type_line);
}

export function landCountFromDeck(deck: Card[]): number {
  return deck.filter(isLand).length;
}

export function evalHand(hand: Card[]): HandEval {
  const landCount = hand.filter(isLand).length;
  const spellCount = hand.length - landCount;
  const earlySpells = hand.filter(c => !isLand(c) && (c.cmc ?? 99) <= 2).length;

  let keep: KeepVerdict;
  if (landCount >= 6) keep = 'flood';
  else if (landCount <= 1) keep = 'screw';
  else if (landCount >= 2 && landCount <= 5 && spellCount >= 1) keep = 'keepable';
  else if (landCount === 2 && spellCount >= 5) keep = 'marginal';
  else keep = 'risky';

  return { landCount, spellCount, earlySpells, keep };
}

export function pLandInDraws(remainingLands: number, librarySize: number, draws: number): number {
  if (librarySize <= 0 || remainingLands <= 0 || draws <= 0) return 0;
  const nonLands = librarySize - remainingLands;
  let pZero = 1;
  for (let i = 0; i < draws; i++) {
    if (librarySize - i <= 0) break;
    pZero *= (nonLands - i) / (librarySize - i);
  }
  return Math.round((1 - pZero) * 100);
}

export function computeSessionStats(samples: OpenerSample[]): SessionStats {
  const n = samples.length;
  if (n === 0) {
    return { keeps: 0, mulls: 0, keepRate: 0, avgLands: '—', twoLandPct: 0, threeLandPct: 0, openers: 0 };
  }
  const keeps = samples.filter(s => s.wasKept).length;
  const mulls = n - keeps;
  const keepRate = Math.round((keeps / n) * 100);
  const avgLands = (samples.reduce((a, s) => a + s.landCount, 0) / n).toFixed(1);
  const twoLandPct = Math.round(samples.filter(s => s.landCount === 2).length / n * 100);
  const threeLandPct = Math.round(samples.filter(s => s.landCount === 3).length / n * 100);
  return { keeps, mulls, keepRate, avgLands, twoLandPct, threeLandPct, openers: n };
}

const LABEL_MAP: Record<KeepVerdict, KeepLabelResult> = {
  keepable: { text: 'Playable', cls: 'keep' },
  marginal: { text: 'Marginal', cls: 'gold' },
  flood:    { text: 'Flood Risk', cls: 'mull' },
  screw:    { text: 'Mana Screw', cls: 'mull' },
  risky:    { text: 'Risky', cls: 'gold' },
};

export function keepLabel(ev: HandEval): KeepLabelResult {
  return LABEL_MAP[ev.keep] ?? { text: 'Unknown', cls: '' };
}
