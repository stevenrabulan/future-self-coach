/**
 * The closing frame (ticket 08): replaces the old dead-end closed state.
 * Presentation only, built from coach.state()'s actionStep — no Brain
 * change. Shows the committed Action Step, confirms the Check-in was
 * logged, and offers to start a new one.
 */
import type React from 'react';
import type { ActionStep } from '../../core/types.js';
import styles from './SummaryCard.module.css';

export interface SummaryCardProps {
  actionStep?: ActionStep;
  /** The Goal Log append's own status: navigation here follows the Check-in
   * closing, independent of whether the append has finished or failed. */
  logStatus: 'pending' | 'done' | 'error';
  error?: string;
  onRestart: () => void;
}

export default function SummaryCard({ actionStep, logStatus, error, onRestart }: SummaryCardProps): React.JSX.Element {
  return (
    <main className={styles.frame}>
      <div className={styles.center}>
        <p className={styles.eyebrow}>Check-in complete</p>
        {actionStep != null ? (
          <div className={styles.card}>
            <p className={styles.cardLabel}>Your Action Step</p>
            <p className={styles.action}>{actionStep.action}</p>
            <p className={styles.when}>{actionStep.when}</p>
          </div>
        ) : (
          <p className={styles.note}>No Action Step was captured this time.</p>
        )}
        {logStatus === 'done' && <p className={styles.confirmation}>Logged to your Goal Log.</p>}
        {logStatus === 'pending' && <p className={styles.confirmation}>Logging to your Goal Log…</p>}
        {logStatus === 'error' && (
          <p className={styles.logError} role="alert">
            Couldn't save to your Goal Log{error != null ? `: ${error}` : '.'}
          </p>
        )}
        <button type="button" className={styles.restart} onClick={onRestart}>
          Start new Check-in
        </button>
      </div>
    </main>
  );
}
