import { describe, expect, it } from 'vitest';
import { createCoach } from './coach.js';
import type { GoalLog, LlmBrain } from './types.js';

/** Canned Brain: echoes a fixed line per call, counting the calls. */
function fakeBrain(messages: string[]): { brain: LlmBrain; calls: () => number } {
  let calls = 0;
  const brain: LlmBrain = ({ state }) => {
    const message = messages[calls] ?? `canned ${calls}`;
    calls += 1;
    // The brain sees the same state Coach Core sees; assert phase travels.
    void state;
    return { message };
  };
  return { brain, calls: () => calls };
}

const emptyGoalLog: GoalLog = { priorActionSteps: [] };

describe('Coach Core: opening a Check-in', () => {
  it('opens with the Framing Questions before any flow content', async () => {
    const { brain } = fakeBrain(['should never be used for the opener']);
    const coach = createCoach({ brain, goalLog: emptyGoalLog });

    const reply = await coach.open();

    expect(reply.phase).toBe('FRAMING');
    expect(reply.message).toContain('1. Ask you questions?');
    expect(reply.message).toContain('2. Interrupt you to keep us on track?');
    expect(reply.message).toContain('3. Make requests?');
    expect(reply.message).toContain(
      '4. Ask you to hold yourself accountable',
    );
    expect(reply.closed).toBe(false);
  });

  it('does not call the LLM Brain for the opening Framing Questions', async () => {
    // The Framing Questions are flow-owned text, not generated content.
    const { brain, calls } = fakeBrain(['nope']);
    const coach = createCoach({ brain, goalLog: emptyGoalLog });

    await coach.open();

    expect(calls()).toBe(0);
  });

  it('surfaces the prior Action Step from the Goal Log at the start', async () => {
    const { brain } = fakeBrain(['let us begin']);
    const goalLog: GoalLog = {
      priorActionSteps: [
        { action: 'Draft the demo spec', when: '2026-09-04 09:00' },
      ],
    };
    const coach = createCoach({ brain, goalLog });

    const reply = await coach.open();

    expect(reply.message).toContain('Draft the demo spec');
    expect(reply.message).toContain('2026-09-04 09:00');
  });
});
