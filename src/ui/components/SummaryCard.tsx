/**
 * The closing frame (ticket 08, restyled in ticket 02): a small idle Coach
 * Orb mark, one line above the Action Step ("Check-in complete"), one line
 * below it (the agreed date and time, with the Goal Log status on the same
 * line) and "Start new Check-in".
 * Presentation only, built from coach.state()'s actionStep: no Brain change.
 */
import type React from 'react';
import type { ActionStep } from '../../core/types.js';
import { formatDisplayDate } from '../display-date.js';
import CoachOrb from './CoachOrb.js';
import { BellIcon } from './icons.js';
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
        <section className={styles.hero} aria-label="Your Action Step">
          <p className={styles.heroAction}>{actionStep.action}</p>
          <p className={styles.heroWhen}>
            <span className={styles.when}>
              <BellIcon />
              {formatDisplayDate(actionStep.when)}
            </span>
            {logStatus !== 'error' && (
              <span className={styles.logNote}>
                {logStatus === 'done' ? 'Saved to your Goal Log' : 'Saving to your Goal Log…'}
              </span>
            )}
          </p>
        </section>
      ) : (
        <>
          <p className={styles.heroNote}>No Action Step was captured this time.</p>
          {logStatus !== 'error' && (
            <p className={styles.heroWhen}>{logStatus === 'done' ? 'Saved to your Goal Log' : 'Saving to your Goal Log…'}</p>
          )}
        </>
      )}
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
