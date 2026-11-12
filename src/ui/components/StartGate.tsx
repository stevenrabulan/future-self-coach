/**
 * The opening frame (ticket 08, restyled in ticket 02): Coach Orb above the
 * product name, one line of framing, "Begin Check-in". The orb shows
 * thinking while the Check-in connects. Deliberately minimal: it does not
 * surface the prior Action Step, which stays owned by the Recall phase once
 * the Check-in starts. Clicking is the real user gesture that unlocks audio
 * autoplay for the coach's first line.
 */
import type React from 'react';
import CoachOrb from './CoachOrb.js';
import { orbStateFor } from './orb-state.js';
import styles from './StartGate.module.css';

export interface StartGateProps {
  onBegin: () => void;
  busy: boolean;
  error?: string;
  /** The status menu, rendered top right. App owns its state. */
  menu?: React.ReactNode;
}

export default function StartGate({ onBegin, busy, error, menu }: StartGateProps): React.JSX.Element {
  return (
    <main className={styles.gate}>
      {menu != null && <div className={styles.corner}>{menu}</div>}
      <CoachOrb state={orbStateFor(busy, null)} size="gate" />
      <h1 className={styles.title}>Future Self Coach</h1>
      <p className={styles.tagline}>A check-in with the version of you a few years out.</p>
      <button type="button" className={styles.begin} onClick={onBegin} disabled={busy}>
        {busy ? 'Connecting…' : 'Begin Check-in'}
      </button>
      {error != null && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </main>
  );
}
