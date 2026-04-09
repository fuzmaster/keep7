export function buildDeck(cardMap, cardData) {
  const dataMap = new Map();

  for (const card of cardData) {
    dataMap.set(card.name.toLowerCase(), card);

    if (card.name.includes('//')) {
      const front = card.name.split('//')[0].trim().toLowerCase();
      if (!dataMap.has(front)) {
        dataMap.set(front, card);
      }
    }
  }

  const deck = [];
  const notFound = [];

  for (const [name, qty] of cardMap.entries()) {
    let card = dataMap.get(name.toLowerCase());

    if (!card && name.includes('//')) {
      card = dataMap.get(name.split('//')[0].trim().toLowerCase());
    }

    for (let i = 0; i < qty; i++) {
      if (card) {
        deck.push({ ...card });
      } else {
        deck.push({ name, placeholder: true });
        if (i === 0) {
          notFound.push(name);
        }
      }
    }
  }

  return { deck, notFound };
}

export function shuffle(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function createDeckState(deck) {
  return { cards: shuffle([...deck]), index: 0 };
}

export function draw(deckState, count) {
  const cards = deckState.cards.slice(deckState.index, deckState.index + count);
  deckState.index += cards.length;
  return cards;
}

export function remaining(deckState) {
  return deckState.cards.length - deckState.index;
}

export function estimateLandCount(cards) {
  return cards.filter((card) => {
    const typeLine = card.type_line || '';
    return /\bLand\b/i.test(typeLine) || /plains|island|swamp|mountain|forest/i.test(card.name || '');
  }).length;
}
