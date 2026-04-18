import { createDeckState, draw } from './engine.js';
import { isLand } from './metrics.js';

export function createGoldfishState(masterDeck) {
  const lib  = createDeckState(masterDeck);
  const hand = draw(lib, 7);
  return { turn: 1, hand, battlefield: [], library: lib, landPlayedThisTurn: false };
}

export function playLand(gf, cardIndex) {
  if (gf.landPlayedThisTurn || cardIndex < 0 || cardIndex >= gf.hand.length) return gf;
  const card = gf.hand[cardIndex];
  if (!card || !isLand(card)) return gf;

  const hand = gf.hand.filter((_, i) => i !== cardIndex);
  return { ...gf, hand, battlefield: [...gf.battlefield, card], landPlayedThisTurn: true };
}

export function advanceTurn(gf) {
  if (gf.turn >= 5) return gf;
  const drawn = draw(gf.library, 1); // mutates library.index — intentional
  return { ...gf, turn: gf.turn + 1, hand: [...gf.hand, ...drawn], landPlayedThisTurn: false };
}

export function goldfishSummary(gf) {
  const mana     = gf.battlefield.length;
  const castable = gf.hand.filter(c => !isLand(c) && (c.cmc ?? 99) <= mana).length;
  return { turn: gf.turn, landsInPlay: gf.battlefield.length, handSize: gf.hand.length, mana, castable };
}

export function getCastableFlags(gf) {
  const mana = gf.battlefield.length;
  return gf.hand.map(c => !isLand(c) && (c.cmc ?? 99) <= mana);
}