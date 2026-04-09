import { getFrontFaceName } from './parser.js';

const CHUNK_SIZE = 75;
const THROTTLE_MS = 150;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchChunk(names) {
  const response = await fetch('https://api.scryfall.com/cards/collection', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ identifiers: names.map((name) => ({ name })) })
  });

  if (!response.ok) {
    const err = new Error(`Scryfall request failed with ${response.status}`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export async function fetchCards(cardNames, onProgress) {
  const chunks = [];
  for (let i = 0; i < cardNames.length; i += CHUNK_SIZE) {
    chunks.push(cardNames.slice(i, i + CHUNK_SIZE));
  }

  const allCards = [];
  const allNotFound = [];

  for (let i = 0; i < chunks.length; i++) {
    if (onProgress) {
      onProgress(i + 1, chunks.length);
    }

    let data;
    try {
      data = await fetchChunk(chunks[i]);
    } catch (err) {
      if (err.status === 429) {
        await sleep(2000);
        data = await fetchChunk(chunks[i]);
      } else {
        throw err;
      }
    }

    allCards.push(...(data.data || []));

    if (data.not_found?.length) {
      allNotFound.push(...data.not_found);
    }

    if (i < chunks.length - 1) {
      await sleep(THROTTLE_MS);
    }
  }

  if (allNotFound.length > 0) {
    const retryNames = allNotFound
      .map((notFound) => notFound.name)
      .filter((name) => name?.includes('//'))
      .map((name) => getFrontFaceName(name));

    if (retryNames.length > 0) {
      try {
        const retryData = await fetchChunk(retryNames);
        allCards.push(...(retryData.data || []));
      } catch (err) {
        console.warn('Split card retry failed', err);
      }
    }
  }

  return allCards;
}
