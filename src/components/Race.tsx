'use client';

import { useRace } from '@/hooks/useRace';
import { CardGrid } from './CardGrid';
import { RaceStats } from './StatsPanel';
import styles from './Race.module.css';

export function Race() {
  const { state, handleCompare, dealNewHands, resetRace, setTextA, setTextB } = useRace();

  return (
    <div className={styles.wrapper}>
      {state.view === 'input' ? (
        <>
          {state.status && (
            <div className={`${styles.status} ${state.statusTone ? styles[`tone_${state.statusTone}`] : ''}`} role="status">
              {state.loading && <span className={styles.spinner} />}
              {state.status}
            </div>
          )}
          {state.error && (
            <div className={styles.error} role="alert">
              {state.error.split('\n').map((l, i) => <div key={i}>{l}</div>)}
            </div>
          )}
          <div className={styles.inputGrid}>
            <div className={styles.inputCol}>
              <label htmlFor="race-a" className={styles.label}>Deck A</label>
              <textarea
                id="race-a"
                className={styles.textarea}
                placeholder={'4 Lightning Bolt\n20 Mountain\n…'}
                value={state.textA}
                onChange={e => setTextA(e.target.value)}
                rows={10}
                spellCheck={false}
              />
            </div>
            <div className={styles.inputCol}>
              <label htmlFor="race-b" className={styles.label}>Deck B</label>
              <textarea
                id="race-b"
                className={styles.textarea}
                placeholder={'4 Counterspell\n20 Island\n…'}
                value={state.textB}
                onChange={e => setTextB(e.target.value)}
                rows={10}
                spellCheck={false}
              />
            </div>
          </div>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleCompare}
            disabled={state.loading || !state.textA.trim() || !state.textB.trim()}
          >
            {state.loading ? 'Comparing…' : 'Compare Decks'}
          </button>
        </>
      ) : (
        <div className={styles.results}>
          <div className={styles.resultGrid}>
            <div>
              {state.statsA && (
                <RaceStats
                  label="Deck A"
                  keepRate={state.statsA.keepRate}
                  avgLands={state.statsA.avgLands}
                  avgT3Land={state.statsA.avgT3Land}
                  floodRisk={state.statsA.floodRisk}
                  screwRisk={state.statsA.screwRisk}
                  deckSize={state.statsA.deckSize}
                  totalLands={state.statsA.totalLands}
                />
              )}
              <h3 className={styles.handLabel}>Deck A Sample Hand</h3>
              <CardGrid cards={state.handA} />
            </div>
            <div>
              {state.statsB && (
                <RaceStats
                  label="Deck B"
                  keepRate={state.statsB.keepRate}
                  avgLands={state.statsB.avgLands}
                  avgT3Land={state.statsB.avgT3Land}
                  floodRisk={state.statsB.floodRisk}
                  screwRisk={state.statsB.screwRisk}
                  deckSize={state.statsB.deckSize}
                  totalLands={state.statsB.totalLands}
                />
              )}
              <h3 className={styles.handLabel}>Deck B Sample Hand</h3>
              <CardGrid cards={state.handB} />
            </div>
          </div>

          {state.verdict.length > 0 && (
            <div className={styles.verdict}>
              <div className={styles.verdictHead}>Analysis</div>
              {state.verdict.map((line, i) => (
                <div key={i} className={styles.verdictLine}>· {line}</div>
              ))}
              <div className={styles.verdictNote}>
                Heuristic — based on 20 simulated openers per deck
              </div>
            </div>
          )}

          {state.status && (
            <div className={`${styles.status} ${styles.tone_warn}`}>{state.status}</div>
          )}

          <div className={styles.controls}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={dealNewHands}>
              New Hands
            </button>
            <button className={styles.btn} onClick={resetRace}>
              ← Edit Decks
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
