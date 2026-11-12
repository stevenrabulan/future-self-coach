/**
 * The closing frame (ticket 08, restyled in ticket 02): a small idle Coach
 * Orb mark, "Check-in complete", the Action Step with its agreed date and
 * time as the centre, the Goal Log line and "Start new Check-in".
 * Presentation only, built from coach.state()'s actionStep: no Brain change.
 */
import type React from 'react';
import type { ActionStep } from '../../core/types.js';
import CoachOrb from './CoachOrb.js';
import styles from './SummaryCard.module.css';

export interface SummaryCardProps {
  actionStep?: ActionStep;
  /** The Goal Log append's own status: navigation here follows the Check-in
   * closing, independent of whether the append has finished or failed. */
  logStatus: 'pending' | 'done' | 'error';
  error?: string;
  onRestart: () => void;
  /** The status menu, rendered top right. App owns its state. */
  menu?: React.ReactNode;
}

export default function SummaryCard({ actionStep, logStatus, error, onRestart, menu }: SummaryCardProps): React.JSX.Element {
  return (
    <main className={styles.frame}>
      {menu != null && <div className={styles.corner}>{menu}</div>}
      <CoachOrb state="idle" size="mark" />
      <p className={styles.eyebrow}>Check-in complete</p>
      {actionStep != null ? (
        <section className={styles.hero} aria-labelledby="action-step-label">
          <p id="action-step-label" className={styles.heroLabel}>
            Your Action Step
          </p>
          <p className={styles.heroAction}>{actionStep.action}</p>
          <p className={styles.heroWhen}>{actionStep.when}</p>
        </section>
      ) : (
        <p className={styles.heroNote}>No Action Step was captured this time.</p>
      )}
      {logStatus === 'done' && <p className={styles.logLine}>Logged to your Goal Log.</p>}
      {logStatus === 'pending' && <p className={styles.logLine}>Logging to your Goal Log…</p>}
      {logStatus === 'error' && (
        <p className={styles.logError} role="alert">
          Couldn't save to your Goal Log{error != null ? `: ${error}` : '.'}
        </p>
      )}
      <button type="button" className={styles.restart} onClick={onRestart}>
        Start new Check-in
      </button>
    </main>
  );
}
