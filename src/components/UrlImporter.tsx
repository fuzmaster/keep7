'use client';

import { useState, useCallback } from 'react';
import { importFromUrl, detectSource } from '@/lib/urlImporter';
import styles from './UrlImporter.module.css';

interface UrlImporterProps {
  onImport: (deckText: string, deckName: string) => void;
}

export function UrlImporter({ onImport }: UrlImporterProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!detectSource(trimmed)) {
      setError('Paste a Moxfield or Archidekt deck URL.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await importFromUrl(trimmed);
      onImport(result.deckText, result.deckName);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setLoading(false);
    }
  }, [url, onImport]);

  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor="url-import">
        Import from URL
      </label>
      <div className={styles.row}>
        <input
          id="url-import"
          type="url"
          className={styles.input}
          placeholder="https://www.moxfield.com/decks/..."
          value={url}
          onChange={e => { setUrl(e.target.value); setError(null); }}
          onKeyDown={e => { if (e.key === 'Enter') handleImport(); }}
          disabled={loading}
        />
        <button
          className={styles.btn}
          onClick={handleImport}
          disabled={loading || !url.trim()}
        >
          {loading ? 'Importing…' : 'Import'}
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.hint}>Supports Moxfield and Archidekt URLs</div>
    </div>
  );
}
