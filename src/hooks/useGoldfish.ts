'use client';

import { useState, useCallback } from 'react';
import type { Card, GoldfishState, GoldfishSummary } from '@/types/card';
import {
  createGoldfishState, playLand, castSpell, advanceTurn,
  tapForMana, tapAll, goldfishSummary, getCastableFlags,
  getPlayableLandFlags,
} from '@/lib/goldfish';
import { isLand } from '@/lib/metrics';

export interface GoldfishHookState {
  gf: GoldfishState | null;
  summary: GoldfishSummary | null;
  castableFlags: boolean[];
  playableFlags: boolean[];
  started: boolean;
}

export function useGoldfish() {
  const [hookState, setHookState] = useState<GoldfishHookState>({
    gf: null,
    summary: null,
    castableFlags: [],
    playableFlags: [],
    started: false,
  });

  const deriveState = useCallback((gf: GoldfishState): GoldfishHookState => ({
    gf,
    summary: goldfishSummary(gf),
    castableFlags: getCastableFlags(gf),
    playableFlags: getPlayableLandFlags(gf),
    started: true,
  }), []);

  const start = useCallback((deck: Card[]) => {
    if (deck.length === 0) return;
    const gf = createGoldfishState(deck);
    setHookState(deriveState(gf));
  }, [deriveState]);

  const doPlayLand = useCallback((handIndex: number) => {
    setHookState(prev => {
      if (!prev.gf) return prev;
      const next = playLand(prev.gf, handIndex);
      return deriveState(next);
    });
  }, [deriveState]);

  const doCastSpell = useCallback((handIndex: number) => {
    setHookState(prev => {
      if (!prev.gf) return prev;
      const next = castSpell(prev.gf, handIndex);
      return deriveState(next);
    });
  }, [deriveState]);

  const doTapForMana = useCallback((bfIndex: number) => {
    setHookState(prev => {
      if (!prev.gf) return prev;
      const next = tapForMana(prev.gf, bfIndex);
      return deriveState(next);
    });
  }, [deriveState]);

  const doTapAll = useCallback(() => {
    setHookState(prev => {
      if (!prev.gf) return prev;
      const next = tapAll(prev.gf);
      return deriveState(next);
    });
  }, [deriveState]);

  const doAdvanceTurn = useCallback(() => {
    setHookState(prev => {
      if (!prev.gf) return prev;
      const next = advanceTurn(prev.gf);
      return deriveState(next);
    });
  }, [deriveState]);

  const reset = useCallback((deck: Card[]) => {
    if (deck.length === 0) {
      setHookState({ gf: null, summary: null, castableFlags: [], playableFlags: [], started: false });
      return;
    }
    const gf = createGoldfishState(deck);
    setHookState(deriveState(gf));
  }, [deriveState]);

  return {
    ...hookState,
    start,
    playLand: doPlayLand,
    castSpell: doCastSpell,
    tapForMana: doTapForMana,
    tapAll: doTapAll,
    advanceTurn: doAdvanceTurn,
    reset,
    isLand,
  };
}
