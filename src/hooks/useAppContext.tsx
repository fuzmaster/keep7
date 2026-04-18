'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Card, AppMode } from '@/types/card';

interface AppContextValue {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  zoomCard: Card | null;
  openZoom: (card: Card) => void;
  closeZoom: () => void;
  masterDeck: Card[];
  setMasterDeck: (d: Card[]) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('handtest');
  const [zoomCard, setZoomCard] = useState<Card | null>(null);
  const [masterDeck, setMasterDeck] = useState<Card[]>([]);

  const openZoom = useCallback((card: Card) => setZoomCard(card), []);
  const closeZoom = useCallback(() => setZoomCard(null), []);

  return (
    <AppContext.Provider value={{ mode, setMode, zoomCard, openZoom, closeZoom, masterDeck, setMasterDeck }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be within AppProvider');
  return ctx;
}
