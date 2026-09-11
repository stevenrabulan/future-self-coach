/**
 * Short, user-facing labels for each Check-in Phase (CONTEXT.md). Shared by
 * Transcript's dividers and PhaseStepper's step labels so the two never
 * describe the same phase with different words.
 */
import type { FlowPhase } from '../core/types.js';

export const PHASE_LABEL: Record<FlowPhase, string> = {
  RECALL: 'Recall',
  FRAMING: 'Framing',
  TOWARD: 'Toward',
  AWAY: 'Away',
  ACTION: 'Action',
  ENROLL: 'Enrollment',
  CLOSED: 'Complete',
};
