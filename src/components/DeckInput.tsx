'use client';

import { useCallback, useState } from 'react';
import { UrlImporter } from './UrlImporter';
import { SAMPLE_DECK } from '@/lib/sampleDeck';
import { loadRandomWebDeck } from '@/lib/remoteDeck';
import { saveWebDeckType, loadWebDeckType } from '@/lib/storage';
import styles from './DeckInput.module.css';

interface DeckInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (text?: string) => void;
  loading: boolean;
  error: string | null;
}

const DECK_TYPES = [
  { value: 'Commander Deck', label: 'Commander' },
  { value: 'Duel Deck', label: 'Duel' },
  { value: 'Event Deck', label: 'Event' },
  { value: 'Theme Deck', label: 'Theme' },
  { value: '__any__', label: 'Any Type' },
];

export function DeckInput({ value, onChange, onSubmit, loading, error }: DeckInputProps) {
  const [webDeckType, setWebDeckType] = useState(loadWebDeckType() ?? 'Commander Deck');
  const [webLoading, setWebLoading] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);

  const handleUrlImport = useCallback((deckText: string) => {
    onChange(deckText);
    onSubmit(deckText);
  }, [onChange, onSubmit]);

  const handleSample = useCallback(() => {
    onChange(SAMPLE_DECK);
  }, [onChange]);

  const handleWebDeck = useCallback(async () => {
    setWebLoading(true);
    setWebError(null);
    try {
      const result = await loadRandomWebDeck({ deckType: webDeckType });
      onChange(result.deckText);
    } catch {
      setWebError('Failed to load a random deck. Try again.');
    } finally {
      setWebLoading(false);
    }
  }, [webDeckType, onChange]);

  const handleTypeChange = useCallback((v: string) => {
    setWebDeckType(v);
    saveWebDeckType(v);
  }, []);

  return (
    <div className={styles.container}>
      <UrlImporter onImport={handleUrlImport} />

      <div className={styles.divider}>
        <span className={styles.dividerText}>or paste a decklist</span>
      </div>

      <label htmlFor="decklist-input" className={styles.label}>
        Decklist
      </label>
      <textarea
        id="decklist-input"
        className={styles.textarea}
        placeholder={`4 Lightning Bolt\n4 Goblin Guide\n20 Mountain\n…`}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={12}
        spellCheck={false}
      />
      <div className={styles.hint}>
        Format: <code>1 Card Name</code> per line. Supports Moxfield exports.
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => onSubmit()}
          disabled={loading || !value.trim()}
        >
          {loading ? 'Loading…' : 'Test Hand'}
        </button>
        <button className={styles.btn} onClick={handleSample} disabled={loading}>
          Paste Sample
        </button>
      </div>

      <div className={styles.webDeckRow}>
        <select
          className={styles.select}
          value={webDeckType}
          onChange={e => handleTypeChange(e.target.value)}
          aria-label="Random deck type"
        >
          {DECK_TYPES.map(dt => (
            <option key={dt.value} value={dt.value}>{dt.label}</option>
          ))}
        </select>
        <button
          className={styles.btn}
          onClick={handleWebDeck}
          disabled={webLoading || loading}
        >
          {webLoading ? 'Fetching…' : 'Random Web Deck'}
        </button>
      </div>
      {webError && <div className={styles.error}>{webError}</div>}
    </div>
  );
}
