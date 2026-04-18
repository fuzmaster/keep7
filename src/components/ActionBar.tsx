'use client';

import styles from './ActionBar.module.css';

interface ActionBarProps {
  onMulligan: () => void;
  onKeep: () => void;
  onNewHand: () => void;
  onReset: () => void;
  handNumber: number;
  showDraws: boolean;
}

export function ActionBar({ onMulligan, onKeep, onNewHand, onReset, handNumber, showDraws }: ActionBarProps) {
  return (
    <div className={styles.bar}>
      {!showDraws ? (
        <>
          <button className={`${styles.btn} ${styles.btnMull}`} onClick={onMulligan}>
            Mulligan
          </button>
          <button className={`${styles.btn} ${styles.btnKeep}`} onClick={onKeep}>
            Keep
          </button>
        </>
      ) : (
        <button className={`${styles.btn} ${styles.btnNew}`} onClick={onNewHand}>
          New Hand
        </button>
      )}
      <button className={`${styles.btn} ${styles.btnReset}`} onClick={onReset}>
        ← Edit Deck
      </button>
      <span className={styles.counter}>Hand #{handNumber}</span>
    </div>
  );
}
