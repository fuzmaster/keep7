'use client';

import { useState, useCallback, useRef } from 'react';
import type { Card, DeckTrialResult } from '@/types/card';
import { parseDecklist } from '@/lib/parser';
import { fetchCards } from '@/lib/scryfall';
import { buildDeck, createDeckState, draw } from '@/lib/engine';
import { deckHash } from '@/lib/hash';
import { saveCardCacheByHash, loadCardCacheByHash } from '@/lib/storage';
import { runDeckTrials, generateVerdict } from '@/lib/race';

export interface RaceState {
  view: 'input' | 'results';
  deckA: Card[] | null;
  deckB: Card[] | null;
  statsA: DeckTrialResult | null;
  statsB: DeckTrialResult | null;
  handA: Card[];
  handB: Card[];
  verdict: string[];
  loading: boolean;
  status: string | null;
  statusTone: 'error' | 'warn' | '';
  error: string | null;
  textA: string;
  textB: string;
}

async function loadOneDeck(
  raw: string,
  label: string,
): Promise<{ deck: Card[]; degraded: boolean }> {
  const { cardMap, errors } = parseDecklist(raw);
  if (cardMap.size === 0) throw new Error(`${label}: No valid cards found.`);
  if (errors.length > 0) throw new Error(`${label}: Unrecognized lines:\n${errors.join('\n')}`);

  const hash = deckHash(raw);
  let cardData: Card[];
  let degraded = false;

  const cached = loadCardCacheByHash(hash);
  if (cached) {
    cardData = cached;
  } else {
    try {
      cardData = await fetchCards([...cardMap.keys()]);
      saveCardCacheByHash(hash, cardData);
    } catch {
      cardData = [];
      degraded = true;
    }
  }

  const { deck } = buildDeck(cardMap, cardData);
  return { deck, degraded };
}

export function useRace() {
  const [state, setState] = useState<RaceState>({
    view: 'input',
    deckA: null,
    deckB: null,
    statsA: null,
    statsB: null,
    handA: [],
    handB: [],
    verdict: [],
    loading: false,
    status: null,
    statusTone: '',
    error: null,
    textA: '',
    textB: '',
  });

  const setPartial = useCallback((patch: Partial<RaceState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const handleCompare = useCallback(async () => {
    if (!state.textA.trim() || !state.textB.trim()) {
      setPartial({ error: 'Paste both decklists to compare.' });
      return;
    }

    setPartial({ loading: true, error: null, status: 'Loading Deck A…', statusTone: '' });

    try {
      const { deck: dA, degraded: degA } = await loadOneDeck(state.textA, 'Deck A');
      setPartial({ status: 'Loading Deck B…' });
      const { deck: dB, degraded: degB } = await loadOneDeck(state.textB, 'Deck B');

      setPartial({ status: 'Running 20 simulated openers per deck…' });

      const statsA = runDeckTrials(dA);
      const statsB = runDeckTrials(dB);
      const verdict = generateVerdict(statsA, statsB);

      const dsA = createDeckState(dA);
      const dsB = createDeckState(dB);
      const handA = draw(dsA, 7);
      const handB = draw(dsB, 7);

      const statusTone = degA || degB ? ('warn' as const) : ('' as const);
      const status = degA || degB ? 'Some card images unavailable (Scryfall down)' : null;

      setPartial({
        deckA: dA,
        deckB: dB,
        statsA,
        statsB,
        handA,
        handB,
        verdict,
        loading: false,
        view: 'results',
        status,
        statusTone,
      });
    } catch (err) {
      setPartial({
        loading: false,
        error: err instanceof Error ? err.message : 'Comparison failed.',
        status: null,
      });
    }
  }, [state.textA, state.textB, setPartial]);

  const dealNewHands = useCallback(() => {
    if (!state.deckA || !state.deckB) return;
    const dsA = createDeckState(state.deckA);
    const dsB = createDeckState(state.deckB);
    setPartial({ handA: draw(dsA, 7), handB: draw(dsB, 7) });
  }, [state.deckA, state.deckB, setPartial]);

  const resetRace = useCallback(() => {
    setState({
      view: 'input', deckA: null, deckB: null,
      statsA: null, statsB: null, handA: [], handB: [],
      verdict: [], loading: false, status: null, statusTone: '',
      error: null, textA: state.textA, textB: state.textB,
    });
  }, [state.textA, state.textB]);

  return {
    state,
    handleCompare,
    dealNewHands,
    resetRace,
    setTextA: (t: string) => setPartial({ textA: t, error: null }),
    setTextB: (t: string) => setPartial({ textB: t, error: null }),
  };
}
