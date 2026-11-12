/** PROTOTYPE (throwaway). CSS-only voice orb: idle / speaking / thinking. */
import type React from 'react';
import styles from './Orb.module.css';

export type OrbState = 'idle' | 'speaking' | 'thinking';

export interface OrbProps {
  state: OrbState;
  /** Visual size class: stage (large), gate, or mark (small summary mark). */
  size: 'stage' | 'gate' | 'mark';
}

export default function Orb({ state, size }: OrbProps): React.JSX.Element {
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
