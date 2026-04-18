'use client';

import type { AppMode } from '@/types/card';
import { useApp } from '@/hooks/useAppContext';
import styles from './Header.module.css';
import { useCallback, useRef } from 'react';

const TABS: { mode: AppMode; label: string }[] = [
  { mode: 'handtest', label: 'Hand Test' },
  { mode: 'goldfish', label: 'Goldfish' },
  { mode: 'race', label: 'Deck Race' },
];

export function Header() {
  const { mode, setMode } = useApp();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = TABS.findIndex(t => t.mode === mode);
    let next = idx;

    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;

    e.preventDefault();
    setMode(TABS[next].mode);
    tabRefs.current[next]?.focus();
  }, [mode, setMode]);

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        Keep<span className={styles.seven}>7</span>
      </div>
      <nav className={styles.tabs} role="tablist" aria-label="App modes" onKeyDown={onKeyDown}>
        {TABS.map((tab, i) => (
          <button
            key={tab.mode}
            ref={el => { tabRefs.current[i] = el; }}
            role="tab"
            aria-selected={mode === tab.mode}
            aria-controls={`panel-${tab.mode}`}
            tabIndex={mode === tab.mode ? 0 : -1}
            className={`${styles.tab} ${mode === tab.mode ? styles.active : ''}`}
            onClick={() => setMode(tab.mode)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
