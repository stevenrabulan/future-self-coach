import { describe, expect, it } from 'vitest';
import { appendCheckin, EMPTY_GOAL_LOG_MARKDOWN, parseGoalLog, recordFromState } from './goal-log.js';
import { createCoach } from '../core/coach.js';
import type { BrainInput, GoalLog, LlmBrain } from '../core/types.js';

/**
 * Scripted Brain, same shape as the Coach Core tests: echoes the phase and
 * the exact question Coach Core hands it.
 */
function scriptedBrain(): LlmBrain {
  return ({ state, question, actionStep }: BrainInput) => {
    if (state.phase === 'ENROLL' && actionStep) {
      return {
        message: `[enroll] You said ${actionStep.action} at ${actionStep.when}. Are you in?`,
      };
    }
    if (state.phase === 'CLOSED') {
      return { message: '[closed] Logged.' };
    }
    return { message: `[${state.phase}] ${question ?? ''}` };
  };
}

const emptyGoalLog: GoalLog = { priorActionSteps: [] };

const FIRST_ANSWERS = [
  'Yes.', // Framing consent
  'Ship the demo.', // TOWARD q1
  'Proof the idea works.', // TOWARD q2
  'It stays an idea.', // AWAY q1
  'Another quiet quarter.', // AWAY q2
  'Write the outline.', // ACTION q1
  'Write the opening.', // ACTION q2
  'Tomorrow at 9am.', // ACTION q3 (agreement)
  'Agreed.', // enrollment
];

async function runFirstCheckin(): Promise<ReturnType<typeof createCoach>> {
  const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
  await coach.open();
  for (const a of FIRST_ANSWERS) await coach.answer(a);
  return coach;
}

describe('Goal Log pipeline: Check-in outcome → record', () => {
  it('derives the Check-in record from the closed conversation state', async () => {
    const coach = await runFirstCheckin();
    const record = recordFromState(coach.state(), '2026-09-05 10:00');

    expect(record.date).toBe('2026-09-05 10:00');
    expect(record.wantedMost).toBe('Ship the demo.');
    expect(record.consequence).toBe('It stays an idea.');
    expect(record.actionStep).toEqual({ action: 'Write the opening.', when: '9am' });
  });

  it('fails loudly when the Check-in has not produced an Action Step yet', () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    expect(() => recordFromState(coach.state(), '2026-09-05 10:00')).toThrow(/Action Step/);
  });
});

describe('Goal Log pipeline: two consecutive Check-ins (recall)', () => {
  it('round-trips the file: append the record, parse it back, recall it', async () => {
    // The full path the CLI exercises: closed Check-in → record → append to
    // the file markdown → parse back → the next coach recalls it.
    const first = await runFirstCheckin();
    const record = recordFromState(first.state(), '2026-09-05 10:00');
    const parsed = parseGoalLog(appendCheckin(EMPTY_GOAL_LOG_MARKDOWN, record));

    const second = createCoach({ brain: scriptedBrain(), goalLog: parsed });
    const open = await second.open();

    expect(parsed.priorActionSteps).toEqual([record.actionStep]);
    expect(open.message).toContain('Write the opening.');
    expect(open.message).toContain('9am');
    expect(open.phase).toBe('RECALL');
  });

  it('the next Check-in opens by surfacing the prior Action Step and asking about it', async () => {
    const first = await runFirstCheckin();
    const record = recordFromState(first.state(), '2026-09-05 10:00');
    const goalLog = { priorActionSteps: [record.actionStep] };

    const second = createCoach({ brain: scriptedBrain(), goalLog });
    const open = await second.open();

    expect(open.message).toContain('Write the opening.');
    expect(open.message).toContain('9am');
    // It asks about it — the client must answer before Framing begins.
    expect(open.message).toMatch(/\?$/);
    expect(open.phase).toBe('RECALL');
  });

  it('the recall answer is acknowledged, then Framing begins', async () => {
    const first = await runFirstCheckin();
    const record = recordFromState(first.state(), '2026-09-05 10:00');
    const goalLog = { priorActionSteps: [record.actionStep] };

    const second = createCoach({ brain: scriptedBrain(), goalLog });
    await second.open();
    const after = await second.answer('Yes, I did it Tuesday morning.');

    expect(after.phase).toBe('FRAMING');
    expect(after.message).toContain('1. Ask you questions?');
  });

  it('a Check-in without prior steps opens straight into Framing (no RECALL)', async () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    const open = await coach.open();
    expect(open.phase).toBe('FRAMING');
    expect(open.message).toContain('1. Ask you questions?');
  });
});