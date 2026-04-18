'use client';

import { useState, useCallback, useRef } from 'react';
import type { Card, DeckState, HandEval, OpenerSample, SessionStats } from '@/types/card';
import { parseDecklist } from '@/lib/parser';
import { fetchCards } from '@/lib/scryfall';
import { buildDeck, createDeckState, draw } from '@/lib/engine';
import { evalHand, computeSessionStats, landCountFromDeck, pLandInDraws, keepLabel } from '@/lib/metrics';
import { deckHash } from '@/lib/hash';
import {
  saveDecklist, loadDecklist, saveCardCacheByHash, loadCardCacheByHash,
  isFirstRun, markFirstRunComplete,
} from '@/lib/storage';
import { SAMPLE_DECK } from '@/lib/sampleDeck';

const VALID_DECK_SIZES = [40, 60, 99, 100];

export interface HandTestState {
  view: 'input' | 'test';
  deckText: string;
  masterDeck: Card[];
  currentHand: Card[];
  nextDraws: Card[];
  handEval: HandEval | null;
  handNumber: number;
  deckLandCount: number;
  drawLandPct: number;
  stats: SessionStats;
  loading: boolean;
  error: string | null;
  warnings: string[];
  statusMessage: string | null;
  statusTone: 'info' | 'ok' | 'warn' | '';
  usedFallback: boolean;
}

const INITIAL_STATS: SessionStats = {
  keeps: 0, mulls: 0, keepRate: 0, avgLands: '—',
  twoLandPct: 0, threeLandPct: 0, openers: 0,
};

export function useHandTest(onDeckReady?: (deck: Card[]) => void) {
  const [state, setState] = useState<HandTestState>({
    view: 'input',
    deckText: loadDecklist() ?? '',
    masterDeck: [],
    currentHand: [],
    nextDraws: [],
    handEval: null,
    handNumber: 0,
    deckLandCount: 0,
    drawLandPct: 0,
    stats: INITIAL_STATS,
    loading: false,
    error: null,
    warnings: [],
    statusMessage: null,
    statusTone: '',
    usedFallback: false,
  });

  const deckStateRef = useRef<DeckState | null>(null);
  const samplesRef = useRef<OpenerSample[]>([]);

  const setPartial = useCallback((patch: Partial<HandTestState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const dealHand = useCallback((deck: Card[]) => {
    const ds = createDeckState(deck);
    deckStateRef.current = ds;
    const hand = draw(ds, 7);
    const ev = evalHand(hand);
    const deckLands = landCountFromDeck(deck);
    const drawPct = pLandInDraws(deckLands - ev.landCount, deck.length - 7, 3);

    setState(prev => ({
      ...prev,
      currentHand: hand,
      nextDraws: [],
      handEval: ev,
      handNumber: prev.handNumber + 1,
      deckLandCount: deckLands,
      drawLandPct: drawPct,
      view: 'test',
    }));
  }, []);

  const handleStart = useCallback(async (rawText?: string) => {
    const text = rawText ?? state.deckText;
    if (!text.trim()) {
      setPartial({ error: 'Paste a decklist to begin.' });
      return;
    }

    setPartial({ loading: true, error: null, warnings: [], statusMessage: null });

    const { cardMap, errors } = parseDecklist(text);
    const deckSize = [...cardMap.values()].reduce((a, b) => a + b, 0);

    if (cardMap.size === 0) {
      setPartial({ loading: false, error: 'No valid cards found. Check your decklist format.' });
      return;
    }

    // Strict validation: halt on any parse errors
    if (errors.length > 0) {
      setPartial({
        loading: false,
        error: `Unrecognized lines found. Fix before continuing:\n${errors.join('\n')}`,
      });
      return;
    }

    if (!VALID_DECK_SIZES.includes(deckSize)) {
      setPartial({ warnings: [`Unusual deck size: ${deckSize} cards`] });
    }

    saveDecklist(text);
    const hash = deckHash(text);

    let cardData: Card[];
    let usedFallback = false;

    const cached = loadCardCacheByHash(hash);
    if (cached) {
      cardData = cached;
    } else {
      try {
        cardData = await fetchCards([...cardMap.keys()]);
        saveCardCacheByHash(hash, cardData);
      } catch {
        cardData = [];
        usedFallback = true;
      }
    }

    const { deck, notFound } = buildDeck(cardMap, cardData);
    const warnings: string[] = [];
    if (usedFallback) warnings.push('Scryfall unavailable — using placeholder cards.');
    if (notFound.length > 0) warnings.push(`Not found: ${notFound.join(', ')}`);

    samplesRef.current = [];
    const statusMessage = usedFallback ? 'Running in offline mode — card images unavailable' : null;

    setPartial({
      masterDeck: deck,
      deckText: text,
      handNumber: 0,
      stats: INITIAL_STATS,
      loading: false,
      warnings,
      usedFallback,
      statusMessage,
      statusTone: usedFallback ? 'warn' : 'ok',
    });

    onDeckReady?.(deck);
    dealHand(deck);
  }, [state.deckText, dealHand, setPartial, onDeckReady]);

  const trackKeep = useCallback(() => {
    if (!state.handEval) return;
    samplesRef.current.push({ landCount: state.handEval.landCount, wasKept: true });
    const stats = computeSessionStats(samplesRef.current);

    // Reveal next 3 draws
    const ds = deckStateRef.current;
    const nextDraws = ds ? draw(ds, 3) : [];

    setPartial({ stats, nextDraws });
  }, [state.handEval, setPartial]);

  const trackMulligan = useCallback(() => {
    if (!state.handEval) return;
    samplesRef.current.push({ landCount: state.handEval.landCount, wasKept: false });
    const stats = computeSessionStats(samplesRef.current);
    setPartial({ stats });
    dealHand(state.masterDeck);
  }, [state.handEval, state.masterDeck, setPartial, dealHand]);

  const newHand = useCallback(() => {
    dealHand(state.masterDeck);
  }, [state.masterDeck, dealHand]);

  const resetToInput = useCallback(() => {
    deckStateRef.current = null;
    samplesRef.current = [];
    setPartial({
      view: 'input',
      currentHand: [],
      nextDraws: [],
      handEval: null,
      handNumber: 0,
      stats: INITIAL_STATS,
      error: null,
      warnings: [],
      statusMessage: null,
    });
  }, [setPartial]);

  const loadDemo = useCallback(() => {
    setPartial({ deckText: SAMPLE_DECK });
    handleStart(SAMPLE_DECK);
  }, [setPartial, handleStart]);

  const setDeckText = useCallback((text: string) => {
    setPartial({ deckText: text, error: null });
  }, [setPartial]);

  const maybeBootstrapFirstRun = useCallback(() => {
    if (isFirstRun()) {
      markFirstRunComplete();
      setPartial({
        deckText: SAMPLE_DECK,
        statusMessage: 'Welcome! We loaded a sample deck. Hit "Test Hand" to try it.',
        statusTone: 'info',
      });
    }
  }, [setPartial]);

  return {
    state,
    handleStart,
    trackKeep,
    trackMulligan,
    newHand,
    resetToInput,
    loadDemo,
    setDeckText,
    maybeBootstrapFirstRun,
    keepLabel,
  };
}
