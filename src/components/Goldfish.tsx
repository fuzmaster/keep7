'use client';

import { useGoldfish } from '@/hooks/useGoldfish';
import { useApp } from '@/hooks/useAppContext';
import { CardSlot } from './CardSlot';
import styles from './Goldfish.module.css';

const MANA_SYMBOLS: Record<string, string> = {
  W: '☀', U: '💧', B: '💀', R: '🔥', G: '🌳', C: '◇',
};

export function Goldfish() {
  const { masterDeck, setMode } = useApp();
  const gf = useGoldfish();

  if (!gf.started || !gf.gf) {
    return (
      <div className={styles.idle}>
        <p className={styles.idleText}>Load a deck in Hand Test first, then come here to goldfish.</p>
        <button className={styles.btn} onClick={() => setMode('handtest')}>
          Go to Hand Test
        </button>
        {masterDeck.length > 0 && (
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => gf.start(masterDeck)}>
            Start Goldfish
          </button>
        )}
      </div>
    );
  }

  const { summary } = gf;
  const manaPool = gf.gf.manaPool;

  return (
    <div className={styles.wrapper}>
      {/* Header bar */}
      <div className={styles.header}>
        <div className={styles.turnBadge}>Turn {summary?.turn ?? 1}</div>
        <div className={styles.manaDisplay}>
          {Object.entries(manaPool).map(([color, amt]) => (
            amt > 0 && (
              <span key={color} className={styles.manaChip}>
                {MANA_SYMBOLS[color]} {amt}
              </span>
            )
          ))}
          {Object.values(manaPool).every(v => v === 0) && (
            <span className={styles.manaEmpty}>No mana</span>
          )}
        </div>
        <div className={styles.info}>
          <span>Hand: {summary?.handSize ?? 0}</span>
          <span>Lands: {summary?.landsInPlay ?? 0}</span>
          <span>Castable: {summary?.castable ?? 0}</span>
        </div>
      </div>

      {/* Hand zone */}
      <section className={styles.zone}>
        <h3 className={styles.zoneTitle}>Hand ({gf.gf.hand.length})</h3>
        <div className={styles.zoneGrid}>
          {gf.gf.hand.map((card, i) => {
            const playable = gf.playableFlags[i];
            const castable = gf.castableFlags[i];
            const highlight = playable ? 'playable' as const : castable ? 'castable' as const : null;
            return (
              <CardSlot
                key={`hand-${card.name}-${i}`}
                card={card}
                index={i}
                highlight={highlight}
                onClick={() => {
                  if (playable) gf.playLand(i);
                  else if (castable) gf.castSpell(i);
                }}
                label={
                  playable ? `Play ${card.name}` :
                  castable ? `Cast ${card.name}` :
                  card.name
                }
              />
            );
          })}
        </div>
      </section>

      {/* Battlefield zone */}
      <section className={styles.zone}>
        <h3 className={styles.zoneTitle}>
          Battlefield ({gf.gf.battlefield.length})
          {gf.gf.battlefield.some(p => !p.tapped) && (
            <button className={styles.tapAllBtn} onClick={gf.tapAll}>Tap All</button>
          )}
        </h3>
        <div className={styles.zoneGrid}>
          {gf.gf.battlefield.map((perm, i) => (
            <CardSlot
              key={`bf-${perm.card.name}-${i}`}
              card={perm.card}
              index={i}
              highlight={perm.tapped ? 'tapped' : null}
              onClick={!perm.tapped ? () => gf.tapForMana(i) : undefined}
              label={perm.tapped ? `${perm.card.name} (tapped)` : `Tap ${perm.card.name}`}
            />
          ))}
        </div>
      </section>

      {/* Graveyard */}
      {gf.gf.graveyard.length > 0 && (
        <section className={styles.zone}>
          <h3 className={styles.zoneTitle}>Graveyard ({gf.gf.graveyard.length})</h3>
          <div className={styles.graveyardList}>
            {gf.gf.graveyard.map((card, i) => (
              <span key={i} className={styles.graveyardCard}>{card.name}</span>
            ))}
          </div>
        </section>
      )}

      {/* Action Log */}
      <details className={styles.logSection}>
        <summary className={styles.zoneTitle}>Action Log</summary>
        <div className={styles.log}>
          {gf.gf.log.map((entry, i) => (
            <div key={i} className={styles.logLine}>{entry}</div>
          ))}
        </div>
      </details>

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={gf.advanceTurn}
          disabled={(summary?.turn ?? 5) >= 5}
        >
          {(summary?.turn ?? 5) >= 5 ? 'Turn 5 (Final)' : 'Next Turn →'}
        </button>
        <button className={styles.btn} onClick={() => gf.reset(masterDeck)}>
          Restart
        </button>
      </div>
    </div>
  );
}
