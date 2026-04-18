'use client';

import type { Card, CardImageUris } from '@/types/card';
import styles from './CardSlot.module.css';

function getImageUrl(card: Card, size: 'small' | 'normal' = 'small'): string | null {
  const uris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  if (!uris) return null;
  return uris[size] ?? uris.small ?? uris.normal ?? null;
}

interface CardSlotProps {
  card: Card;
  index?: number;
  size?: 'small' | 'normal';
  onClick?: () => void;
  highlight?: 'playable' | 'castable' | 'tapped' | null;
  label?: string;
  lazy?: boolean;
}

export function CardSlot({
  card,
  index = 0,
  size = 'small',
  onClick,
  highlight,
  label,
  lazy = true,
}: CardSlotProps) {
  const src = getImageUrl(card, size);
  const delay = index * 35;

  const cls = [
    styles.slot,
    highlight === 'playable' && styles.playable,
    highlight === 'castable' && styles.castable,
    highlight === 'tapped' && styles.tapped,
    onClick && styles.interactive,
  ].filter(Boolean).join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cls}
      style={{ animationDelay: `${delay}ms` }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={label ?? `View ${card.name}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {src ? (
        <img
          src={src}
          alt={card.name}
          width={146}
          height={204}
          loading={lazy ? 'lazy' : undefined}
          draggable={false}
        />
      ) : (
        <div className={styles.placeholder}>
          <div className={styles.placeholderName}>{card.name}</div>
          <div className={styles.placeholderMeta}>Image unavailable</div>
        </div>
      )}
    </div>
  );
}

export function SkeletonSlot({ index = 0 }: { index?: number }) {
  return (
    <div
      className={`${styles.slot} ${styles.skeleton}`}
      style={{ animationDelay: `${index * 35}ms` }}
      aria-hidden
    />
  );
}
