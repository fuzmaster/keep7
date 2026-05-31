'use client';

import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <p className={styles.privacy}>
          Keep7 runs entirely in your browser. Your deck text and session data never leave your device.
        </p>
        <nav className={styles.links} aria-label="Site links">
          <a className={styles.link} href="https://forms.gle/JVfmheEevuJtwwBH8" target="_blank" rel="noopener noreferrer">
            Report a bug
          </a>
          <a className={styles.link} href="https://www.paypal.com/donate/?hosted_button_id=47A4JJ4WNBY9U" target="_blank" rel="noopener noreferrer">
            Donate
          </a>
          <a className={styles.link} href="https://github.com/fuzmaster/keep7" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
