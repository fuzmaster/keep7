'use client';

import type { HandEval, SessionStats, KeepLabelResult } from '@/types/card';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
  eval: HandEval | null;
  stats: SessionStats;
  label: KeepLabelResult | null;
  drawLandPct: number;
  handNumber: number;
}

export function StatsPanel({ eval: ev, stats, label, drawLandPct, handNumber }: StatsPanelProps) {
  if (!ev) return null;

  return (
    <div className={styles.panel}>
      {label && (
        <div className={`${styles.evalBadge} ${styles[label.cls] ?? ''}`}>
          {label.text}
        </div>
      )}

      <div className={styles.grid}>
        <StatChip name="Lands" value={`${ev.landCount}/7`} />
        <StatChip name="Spells" value={`${ev.spellCount}`} />
        <StatChip name="Early (≤2)" value={`${ev.earlySpells}`} />
        <StatChip name="T3 Land %" value={`${drawLandPct}%`} />
      </div>

      {stats.openers > 0 && (
        <>
          <div className={styles.sessionHeader}>Session ({stats.openers} hands)</div>
          <div className={styles.grid}>
            <StatChip name="Keep Rate" value={`${stats.keepRate}%`} />
            <StatChip name="Avg Lands" value={stats.avgLands} />
            <StatChip name="2-Land %" value={`${stats.twoLandPct}%`} />
            <StatChip name="3-Land %" value={`${stats.threeLandPct}%`} />
          </div>
        </>
      )}
    </div>
  );
}

function StatChip({ name, value }: { name: string; value: string }) {
  return (
    <div className={styles.chip}>
      <span className={styles.chipLabel}>{name}</span>
      <span className={styles.chipValue}>{value}</span>
    </div>
  );
}

/* Race-specific stats */
interface RaceStatsProps {
  label: string;
  keepRate: number;
  avgLands: string;
  avgT3Land: number;
  floodRisk: number;
  screwRisk: number;
  deckSize: number;
  totalLands: number;
}

export function RaceStats({
  label, keepRate, avgLands, avgT3Land, floodRisk, screwRisk, deckSize, totalLands,
}: RaceStatsProps) {
  return (
    <div className={styles.racePanel}>
      <div className={styles.raceLabel}>{label}</div>
      <div className={styles.raceGrid}>
        <StatChip name="Keep Rate" value={`${keepRate}%`} />
        <StatChip name="Avg Lands" value={avgLands} />
        <StatChip name="T3 Land" value={`${avgT3Land}%`} />
        <StatChip name="Flood Risk" value={`${floodRisk}%`} />
        <StatChip name="Screw Risk" value={`${screwRisk}%`} />
        <StatChip name="Deck" value={`${totalLands}/${deckSize}`} />
      </div>
    </div>
  );
}
