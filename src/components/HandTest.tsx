'use client';

import { useEffect } from 'react';
import { useHandTest } from '@/hooks/useHandTest';
import { useApp } from '@/hooks/useAppContext';
import { DeckInput } from './DeckInput';
import { CardGrid } from './CardGrid';
import { StatsPanel } from './StatsPanel';
import { ActionBar } from './ActionBar';
import styles from './HandTest.module.css';

export function HandTest() {
  const { setMasterDeck } = useApp();
  const {
    state, handleStart, trackKeep, trackMulligan, newHand,
    resetToInput, loadDemo, setDeckText, maybeBootstrapFirstRun, keepLabel,
  } = useHandTest((deck) => setMasterDeck(deck));

  useEffect(() => {
    maybeBootstrapFirstRun();
  }, [maybeBootstrapFirstRun]);

  const label = state.handEval ? keepLabel(state.handEval) : null;
  const showDraws = state.nextDraws.length > 0;

  return (
    <div className={styles.wrapper}>
      {state.view === 'input' ? (
        <div className={styles.inputPanel}>
          {state.statusMessage && (
            <div className={`${styles.statusBanner} ${styles[`tone_${state.statusTone}`] ?? ''}`}>
              {state.statusMessage}
            </div>
          )}
          <DeckInput
            value={state.deckText}
            onChange={setDeckText}
            onSubmit={handleStart}
            loading={state.loading}
            error={state.error}
          />
          <button className={styles.demoBtn} onClick={loadDemo}>
            Load Demo Deck
          </button>
        </div>
      ) : (
        <div className={styles.testLayout}>
          <aside className={styles.sidebar}>
            <StatsPanel
              eval={state.handEval}
              stats={state.stats}
              label={label}
              drawLandPct={state.drawLandPct}
              handNumber={state.handNumber}
            />
            {state.warnings.length > 0 && (
              <div className={styles.warnings}>
                {state.warnings.map((w, i) => (
                  <div key={i} className={styles.warningLine}>⚠ {w}</div>
                ))}
              </div>
            )}
          </aside>
          <main className={styles.playArea}>
            <div className={styles.handSection}>
              <h2 className={styles.sectionTitle}>
                Opening Hand
                {state.usedFallback && <span className={styles.degraded}> (placeholder mode)</span>}
              </h2>
              <CardGrid cards={state.currentHand} loading={state.loading} />
            </div>

            {showDraws && (
              <div className={styles.drawSection}>
                <h2 className={styles.sectionTitle}>Next 3 Draws</h2>
                <CardGrid cards={state.nextDraws} />
              </div>
            )}

            <ActionBar
              onMulligan={trackMulligan}
              onKeep={trackKeep}
              onNewHand={newHand}
              onReset={resetToInput}
              handNumber={state.handNumber}
              showDraws={showDraws}
            />
          </main>
        </div>
      )}
    </div>
  );
}
