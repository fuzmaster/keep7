'use client';

import { useApp } from '@/hooks/useAppContext';
import type { Card } from '@/types/card';
import styles from './ZoomModal.module.css';
import { useEffect, useCallback } from 'react';

function getImageUrl(card: Card): string | null {
  const uris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  return uris?.normal ?? uris?.large ?? uris?.small ?? null;
}

export function ZoomModal() {
  const { zoomCard, closeZoom } = useApp();

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') closeZoom();
  }, [closeZoom]);

  useEffect(() => {
    if (zoomCard) {
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
  }, [zoomCard, onKeyDown]);

  if (!zoomCard) return null;

  const src = getImageUrl(zoomCard);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${zoomCard.name}`}
      onClick={closeZoom}
    >
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        {src ? (
          <img src={src} alt={zoomCard.name} className={styles.image} />
        ) : (
          <div className={styles.fallback}>{zoomCard.name}</div>
        )}
        <div className={styles.cardName}>{zoomCard.name}</div>
      </div>
    </div>
  );
}
