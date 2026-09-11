/**
 * The opening frame (ticket 08): wordmark, one line of framing, "Begin
 * Check-in". Deliberately minimal — it does not surface the prior Action
 * Step, which stays owned by the Recall phase once the Check-in starts.
 * Clicking is the real user gesture that unlocks audio autoplay for the
 * coach's first line.
 */
import type React from 'react';
import styles from './StartGate.module.css';

export interface StartGateProps {
  onBegin: () => void;
  busy: boolean;
  error?: string;
}

export default function StartGate({ onBegin, busy, error }: StartGateProps): React.JSX.Element {
  return (
    <main className={styles.gate}>
      <div className={styles.center}>
        <h1 className={styles.wordmark}>Future Self Coach</h1>
        <p className={styles.tagline}>A check-in with the version of you a few years out.</p>
        <button type="button" className={styles.begin} onClick={onBegin} disabled={busy}>
          {busy ? 'Connecting…' : 'Begin Check-in'}
        </button>
        {error != null && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
