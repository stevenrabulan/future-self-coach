import type { FlowPhase } from '../../core/types.js';
import type { ChatLine } from './Transcript.js';

/** The newest coach line: the stage caption and the target of stage replay. */
export function latestCoachLine(lines: readonly ChatLine[]): ChatLine | undefined {
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (l?.role === 'coach') return l;
  }
  return undefined;
}

export interface PhaseGroup {
  /** undefined only for lines that precede any phase. */
  phase: FlowPhase | undefined;
  lines: ChatLine[];
}

/**
 * Groups consecutive lines by Check-in Phase. A line without a phase (a
 * system note) stays in the group it follows.
 */
export function groupByPhase(lines: readonly ChatLine[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  for (const l of lines) {
    const current = groups[groups.length - 1];
    if (current != null && (l.phase == null || l.phase === current.phase)) {
      current.lines.push(l);
    } else {
      groups.push({ phase: l.phase, lines: [l] });
    }
  }
  return groups;
}
