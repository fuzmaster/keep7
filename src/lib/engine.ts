import type { Card, DeckState } from '@/types/card';

const LAND_NAME_HINTS =
  /\b(plains|island|swamp|mountain|forest|tower|temple|garden|sanctum|cavern|delta|strand|mesa|tarn|flats|heath|mire|crypt|tomb|bog|wastes|lair|grove|falls|reef|springs|fountain|basin|canal|channel|gate|plaza|court|citadel|den|ruins|mine|reach|path)\b/i;

function inferLandFromName(name: string): boolean {
  return LAND_NAME_HINTS.test(name);
}

export function createFallbackCard(name: string): Card {
  const likelyLand = inferLandFromName(name);
  return {
    name,
    type_line: likelyLand ? 'Land' : 'Unknown',
    cmc: likelyLand ? 0 : 99,
    mana_cost: '',
    placeholder: true,
  };
}

export function buildDeck(
  cardMap: Map<string, number>,
  cardData: Card[],
): { deck: Card[]; notFound: string[] } {
  const dataMap = new Map<string, Card>();
  for (const c of cardData) dataMap.set(c.name.toLowerCase(), c);

  const deck: Card[] = [];
  const notFound: string[] = [];

  for (const [name, qty] of cardMap) {
    const card = dataMap.get(name.toLowerCase()) ?? createFallbackCard(name);
    if (card.placeholder) notFound.push(name);
    for (let i = 0; i < qty; i++) deck.push({ ...card });
  }

  return { deck, notFound };
}

export function shuffle<T>(cards: T[]): T[] {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function createDeckState(deck: Card[]): DeckState {
  return { cards: shuffle([...deck]), index: 0 };
}

export function draw(state: DeckState, count: number): Card[] {
  const drawn = state.cards.slice(state.index, state.index + count);
  state.index += drawn.length;
  return drawn;
}

export function remaining(state: DeckState): number {
  return state.cards.length - state.index;
}

export function estimateLandCount(cards: Card[]): number {
  return cards.filter(c => /\bLand\b/i.test(c.type_line)).length;
}
