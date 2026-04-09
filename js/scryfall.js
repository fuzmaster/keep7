import { getFrontFaceName } from './parser.js';

const CHUNK_SIZE = 75;
const THROTTLE_MS = 150;
const REQUEST_TIMEOUT_MS = 12000;
const MAX_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchChunk(names, retries = MAX_RETRIES) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({ identifiers: names.map((name) => ({ name })) })
      });

      if (!response.ok) {
        const err = new Error(`Scryfall request failed with ${response.status}`);
        err.status = response.status;

        // Retry transient API/rate-limit errors.
        if ((response.status === 429 || response.status >= 500) && attempt < retries) {
          const backoffMs = response.status === 429 ? 2000 : 800 * (attempt + 1);
          await sleep(backoffMs);
          continue;
        }

        throw err;
      }

      return await response.json();
    } catch (err) {
      lastError = err;

      // Retry network and timeout failures.
      const isAbort = err?.name === 'AbortError';
      const isNetwork = err?.name === 'TypeError';
      if ((isAbort || isNetwork) && attempt < retries) {
        await sleep(600 * (attempt + 1));
        continue;
      }

      if (attempt >= retries) throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error('Scryfall request failed.');
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

    const data = await fetchChunk(chunks[i]);

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
