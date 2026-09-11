/**
 * The three-step spine (ticket 08): Toward → Away → Action. Recall and
 * Framing render as a lead-in label rather than dots; Enrollment folds into
 * the Action step. Matches the Check-in Phase term in CONTEXT.md: seven
 * phases exist internally, only the three spine steps are user-facing.
 */
import type React from 'react';
import type { FlowPhase } from '../../core/types.js';
import { PHASE_LABEL } from '../phase-labels.js';
import styles from './PhaseStepper.module.css';

const STEP_PHASES: FlowPhase[] = ['TOWARD', 'AWAY', 'ACTION'];

const LEAD_IN_LABEL: Partial<Record<FlowPhase, string>> = {
  RECALL: 'Recalling your last Action Step…',
  FRAMING: 'Framing the Check-in…',
};

/** ENROLL is Action's sell-through, not a fourth step. */
function stepIndexForPhase(phase: FlowPhase): number {
  const effective = phase === 'ENROLL' ? 'ACTION' : phase;
  return STEP_PHASES.indexOf(effective);
}

export interface PhaseStepperProps {
  phase: FlowPhase;
}

export default function PhaseStepper({ phase }: PhaseStepperProps): React.JSX.Element {
  const leadIn = LEAD_IN_LABEL[phase];
  if (leadIn != null) {
    return <p className={styles.leadIn}>{leadIn}</p>;
  }

  const activeIndex = stepIndexForPhase(phase);
  return (
    <ol className={styles.stepper}>
      {STEP_PHASES.map((stepPhase, i) => (
        <li
          key={stepPhase}
          className={styles.step}
          data-state={i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'}
        >
          <span className={styles.dot} />
          <span className={styles.label}>{PHASE_LABEL[stepPhase]}</span>
        </li>
      ))}
    </ol>
  );
}
