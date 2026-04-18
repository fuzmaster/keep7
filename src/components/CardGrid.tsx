'use client';

import type { Card } from '@/types/card';
import { useApp } from '@/hooks/useAppContext';
import { CardSlot, SkeletonSlot } from './CardSlot';
import styles from './CardGrid.module.css';

interface CardGridProps {
  cards: Card[];
  loading?: boolean;
  skeletonCount?: number;
  highlightFlags?: (('playable' | 'castable' | null) | undefined)[];
  onCardClick?: (card: Card, index: number) => void;
  label?: string;
}

export function CardGrid({
  cards,
  loading = false,
  skeletonCount = 7,
  highlightFlags,
  onCardClick,
  label,
}: CardGridProps) {
  const { openZoom } = useApp();

  if (loading) {
    return (
      <div className={styles.grid} aria-label={label}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonSlot key={i} index={i} />
        ))}
      </div>
    );
  }

  if (cards.length === 0) return null;

  return (
    <div className={styles.grid} aria-label={label}>
      {cards.map((card, i) => {
        const highlight = highlightFlags?.[i] ?? null;
        return (
          <CardSlot
            key={`${card.name}-${i}`}
            card={card}
            index={i}
            highlight={highlight}
            onClick={() => {
              if (onCardClick) onCardClick(card, i);
              else openZoom(card);
            }}
          />
        );
      })}
    </div>
  );
}
