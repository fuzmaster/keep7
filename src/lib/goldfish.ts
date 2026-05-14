import type { Card, DeckState, GoldfishState, GoldfishSummary, ManaPool, ManaCost, Permanent } from '@/types/card';
import { createDeckState, draw } from './engine';
import { isLand } from './metrics';

/* ── Mana color inference ─────────────────────────────── */

const BASIC_COLOR_MAP: Record<string, keyof ManaPool> = {
  plains: 'W', island: 'U', swamp: 'B', mountain: 'R', forest: 'G',
};

function inferManaColors(card: Card): (keyof ManaPool)[] {
  const tl = card.type_line.toLowerCase();
  const colors = Object.entries(BASIC_COLOR_MAP)
    .filter(([basic]) => tl.includes(basic))
    .map(([, color]) => color);
  return colors.length > 0 ? colors : ['C'];
}

export function emptyManaPool(): ManaPool {
  return { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
}

function totalMana(pool: ManaPool): number {
  return pool.W + pool.U + pool.B + pool.R + pool.G + pool.C;
}

/* ── Mana cost parsing ────────────────────────────────── */

export function parseMana(manaCost: string): ManaCost {
  const colors: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  let generic = 0;
  const symbols = manaCost.match(/\{([^}]+)\}/g) ?? [];
  for (const sym of symbols) {
    const inner = sym.slice(1, -1).toUpperCase();
    if (/^\d+$/.test(inner)) {
      generic += parseInt(inner, 10);
    } else if (inner in colors) {
      colors[inner]++;
    } else if (inner === 'X') {
      // X counts as 0 for castability check purposes
    }
    // Hybrid/phyrexian: simplified — count as the first color
    else if (inner.includes('/')) {
      const first = inner.split('/')[0];
      if (first in colors) colors[first]++;
      else generic++;
    }
  }
  const total = generic + Object.values(colors).reduce((a, b) => a + b, 0);
  return { generic, colors, total };
}

export function canPayCost(pool: ManaPool, cost: ManaCost): boolean {
  const remaining = { ...pool };
  for (const [color, amount] of Object.entries(cost.colors)) {
    const key = color as keyof ManaPool;
    if ((remaining[key] ?? 0) < amount) return false;
    remaining[key] -= amount;
  }
  const leftover = Object.values(remaining).reduce((a, b) => a + b, 0);
  return leftover >= cost.generic;
}

function chooseProducedColor(gf: GoldfishState, producesColors: (keyof ManaPool)[]): keyof ManaPool {
  if (producesColors.length <= 1) return producesColors[0] ?? 'C';

  const deficits = new Map<keyof ManaPool, number>();
  for (const color of producesColors) deficits.set(color, 0);

  for (const card of gf.hand) {
    if (isLand(card)) continue;
    const cost = parseMana(card.mana_cost);
    for (const color of producesColors) {
      const needed = cost.colors[color] ?? 0;
      if (needed > 0) {
        const unmet = Math.max(0, needed - gf.manaPool[color]);
        deficits.set(color, (deficits.get(color) ?? 0) + unmet);
      }
    }
  }

  let best = producesColors[0];
  let bestScore = deficits.get(best) ?? 0;

  for (const color of producesColors.slice(1)) {
    const score = deficits.get(color) ?? 0;
    if (score > bestScore) {
      best = color;
      bestScore = score;
    }
  }

  return best;
}

/* ── State creation ───────────────────────────────────── */

export function createGoldfishState(masterDeck: Card[]): GoldfishState {
  const library = createDeckState(masterDeck);
  const hand = draw(library, 7);
  return {
    turn: 1,
    hand,
    battlefield: [],
    graveyard: [],
    library,
    manaPool: emptyManaPool(),
    landPlayedThisTurn: false,
    spellsCastThisTurn: 0,
    log: ['Game started. Opening hand drawn.'],
  };
}

/* ── Actions ──────────────────────────────────────────── */

export function tapForMana(gf: GoldfishState, bfIndex: number): GoldfishState {
  const perm = gf.battlefield[bfIndex];
  if (!perm || perm.tapped) return gf;

  const newBf = gf.battlefield.map((p, i) =>
    i === bfIndex ? { ...p, tapped: true } : p,
  );
  const newPool = { ...gf.manaPool };
  const produced = chooseProducedColor(gf, perm.producesColors);
  newPool[produced]++;

  return {
    ...gf,
    battlefield: newBf,
    manaPool: newPool,
    log: [...gf.log, `Tapped ${perm.card.name} for {${produced}}`],
  };
}

export function tapAll(gf: GoldfishState): GoldfishState {
  const newPool = { ...gf.manaPool };
  const additions: (keyof ManaPool)[] = [];
  const newBf = gf.battlefield.map(p => {
    if (p.tapped) return p;
    const produced = chooseProducedColor({ ...gf, manaPool: newPool }, p.producesColors);
    newPool[produced]++;
    additions.push(produced);
    return { ...p, tapped: true };
  });
  return {
    ...gf,
    battlefield: newBf,
    manaPool: newPool,
    log: [
      ...gf.log,
      `Tapped all lands (${totalMana(newPool)} mana available${additions.length ? `: ${additions.join(', ')}` : ''})`,
    ],
  };
}

export function playLand(gf: GoldfishState, handIndex: number): GoldfishState {
  if (gf.landPlayedThisTurn || handIndex < 0 || handIndex >= gf.hand.length) return gf;
  const card = gf.hand[handIndex];
  if (!card || !isLand(card)) return gf;

  const hand = gf.hand.filter((_, i) => i !== handIndex);
  const perm: Permanent = {
    card,
    tapped: false,
    producesColors: inferManaColors(card),
  };

  return {
    ...gf,
    hand,
    battlefield: [...gf.battlefield, perm],
    landPlayedThisTurn: true,
    log: [...gf.log, `Played ${card.name}`],
  };
}

export function castSpell(gf: GoldfishState, handIndex: number): GoldfishState {
  if (handIndex < 0 || handIndex >= gf.hand.length) return gf;
  const card = gf.hand[handIndex];
  if (!card || isLand(card)) return gf;

  const cost = parseMana(card.mana_cost);
  if (!canPayCost(gf.manaPool, cost)) return gf;

  // Spend mana: colored first, then generic from largest pool
  const newPool = { ...gf.manaPool };
  for (const [color, amount] of Object.entries(cost.colors)) {
    newPool[color as keyof ManaPool] -= amount;
  }
  let genericLeft = cost.generic;
  const poolKeys: (keyof ManaPool)[] = ['C', 'W', 'U', 'B', 'R', 'G'];
  for (const key of poolKeys) {
    if (genericLeft <= 0) break;
    const spend = Math.min(newPool[key], genericLeft);
    newPool[key] -= spend;
    genericLeft -= spend;
  }

  const hand = gf.hand.filter((_, i) => i !== handIndex);

  return {
    ...gf,
    hand,
    graveyard: [...gf.graveyard, card],
    manaPool: newPool,
    spellsCastThisTurn: gf.spellsCastThisTurn + 1,
    log: [...gf.log, `Cast ${card.name} (${card.mana_cost})`],
  };
}

export function advanceTurn(gf: GoldfishState): GoldfishState {
  if (gf.turn >= 5) return gf;
  const drawn = draw(gf.library, 1);

  // Untap all permanents
  const newBf = gf.battlefield.map(p => ({ ...p, tapped: false }));

  return {
    ...gf,
    turn: gf.turn + 1,
    hand: [...gf.hand, ...drawn],
    battlefield: newBf,
    manaPool: emptyManaPool(),
    landPlayedThisTurn: false,
    spellsCastThisTurn: 0,
    log: [...gf.log, `— Turn ${gf.turn + 1} — Drew ${drawn[0]?.name ?? 'nothing'}`],
  };
}

/* ── Queries ──────────────────────────────────────────── */

export function goldfishSummary(gf: GoldfishState): GoldfishSummary {
  const available = totalMana(gf.manaPool);
  const castable = gf.hand.filter(c => {
    if (isLand(c)) return false;
    const cost = parseMana(c.mana_cost);
    return canPayCost(gf.manaPool, cost);
  }).length;

  return {
    turn: gf.turn,
    landsInPlay: gf.battlefield.length,
    handSize: gf.hand.length,
    availableMana: available,
    manaPool: { ...gf.manaPool },
    castable,
  };
}

export function getCastableFlags(gf: GoldfishState): boolean[] {
  return gf.hand.map(c => {
    if (isLand(c)) return false;
    const cost = parseMana(c.mana_cost);
    return canPayCost(gf.manaPool, cost);
  });
}

export function getPlayableLandFlags(gf: GoldfishState): boolean[] {
  return gf.hand.map(c => !gf.landPlayedThisTurn && isLand(c));
}
