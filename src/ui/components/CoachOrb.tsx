/**
 * The Coach Orb (ADR 0005): the coach's on-screen presence, not a control.
 * CSS only; the look follows `state` (idle, speaking, thinking). Hidden from
 * assistive tech: the coach's words are carried by text, never by the orb.
 */
import type React from 'react';
import styles from './CoachOrb.module.css';
import type { OrbState } from './orb-state.js';

export interface CoachOrbProps {
  state: OrbState;
  /** stage (280px), gate (240px) or mark (60px). */
  size: 'stage' | 'gate' | 'mark';
}

export default function CoachOrb({ state, size }: CoachOrbProps): React.JSX.Element {
  return (
    <div className={styles.orb} data-state={state} data-size={size} aria-hidden="true">
      <span className={styles.glow} />
      <span className={styles.ring} />
      <span className={styles.ring} />
      <span className={styles.ring} />
      <span className={styles.core}>
        <span className={styles.swirl} />
        <span className={styles.sheen} />
      </span>
      <span className={styles.arc} />
    </div>
  );
}
