/**
 * Ticket 07: the Framing Questions render as a numbered list, and an
 * acceptance recorded in the Goal Log turns them into a reminder on a later
 * Check-in.
 */
import { describe, expect, it } from 'vitest';
import { createCoach } from './coach.js';
import { FRAMING_ITEMS, FRAMING_QUESTIONS, FRAMING_REMINDER } from './flow-text.js';
import type { BrainInput, GoalLog, LlmBrain } from './types.js';

/** Echoes the flow question so tests can see exactly what Coach Core asked. */
const echoBrain: LlmBrain = (input: BrainInput) => ({
  message: input.question ?? '(no question)',
});

const emptyLog: GoalLog = { priorActionSteps: [] };

describe('Framing Questions as an ordered list', () => {
  it('opens with a lead-in and four numbered questions on their own lines', async () => {
    const coach = createCoach({ brain: echoBrain, goalLog: emptyLog });
    const reply = await coach.open();

    const lines = reply.message.split('\n');
    expect(lines[0]).toBe('Hey, is it ok if I:');
    expect(lines[1]).toBe('1. Ask you questions?');
    expect(lines[2]).toBe('2. Interrupt you to keep us on track?');
    expect(lines[3]).toBe('3. Make requests?');
    expect(lines[4]).toBe(
      '4. Ask you to hold yourself accountable for what you agree to do?',
    );
    expect(lines).toHaveLength(5);
  });

  it('keeps the questions and the reminder on the same four items', () => {
    expect(FRAMING_ITEMS).toHaveLength(4);
    for (const item of FRAMING_ITEMS) {
      expect(FRAMING_QUESTIONS).toContain(item);
      expect(FRAMING_REMINDER).toContain(item);
    }
  });

  it('ends the reminder with "As we agreed." and asks nothing', () => {
    expect(FRAMING_REMINDER.startsWith('Hey again, just to remind you, I will:')).toBe(true);
    expect(FRAMING_REMINDER.trimEnd().endsWith('As we agreed.')).toBe(true);
    expect(FRAMING_REMINDER).not.toContain('?');
  });
});

describe('recording the client acceptance', () => {
  it.each(['yes', 'Yes, go ahead.', 'sure', 'yea', 'yeah', 'yep', 'ok', 'Sounds good!'])(
    'treats %j as acceptance',
    async (answer) => {
      const coach = createCoach({ brain: echoBrain, goalLog: emptyLog });
      await coach.open();
      await coach.answer(answer);
      expect(coach.state().framingAccepted).toBe(true);
    },
  );

  it.each(['no', 'not now', "I can't", 'maybe later', 'why do you ask'])(
    'does not treat %j as acceptance',
    async (answer) => {
      const coach = createCoach({ brain: echoBrain, goalLog: emptyLog });
      await coach.open();
      await coach.answer(answer);
      expect(coach.state().framingAccepted).toBeUndefined();
    },
  );

  it('advances to TOWARD either way (a non-accept does not stall the flow)', async () => {
    const accepted = createCoach({ brain: echoBrain, goalLog: emptyLog });
    await accepted.open();
    expect((await accepted.answer('sure')).phase).toBe('TOWARD');

    const declined = createCoach({ brain: echoBrain, goalLog: emptyLog });
    await declined.open();
    expect((await declined.answer('no')).phase).toBe('TOWARD');
  });

  it('does not re-record acceptance from a later "yes" outside FRAMING', async () => {
    const coach = createCoach({ brain: echoBrain, goalLog: emptyLog });
    await coach.open();
    await coach.answer('no');
    await coach.answer('yes, definitely'); // a TOWARD answer, not consent
    expect(coach.state().framingAccepted).toBeUndefined();
  });
});

describe('a Goal Log that already holds an acceptance', () => {
  const acceptedLog: GoalLog = {
    priorActionSteps: [],
    framingAcceptedOn: '2026-09-01 09:00',
  };

  it('reminds instead of asking, on open()', async () => {
    const coach = createCoach({ brain: echoBrain, goalLog: acceptedLog });
    const reply = await coach.open();
    expect(reply.message).toBe(FRAMING_REMINDER);
    expect(reply.phase).toBe('FRAMING');
  });

  it('reminds after the recall question too', async () => {
    const coach = createCoach({
      brain: echoBrain,
      goalLog: {
        priorActionSteps: [{ action: 'Write the spec', when: '9am' }],
        framingAcceptedOn: '2026-09-01 09:00',
      },
    });
    const open = await coach.open();
    expect(open.phase).toBe('RECALL');
    const reply = await coach.answer('Yes, I did it.');
    expect(reply.phase).toBe('FRAMING');
    // The Brain writes the recall acknowledgement; the reminder itself is
    // appended verbatim, so its line breaks survive the round trip.
    expect(reply.message.endsWith(FRAMING_REMINDER)).toBe(true);
  });

  it('never hands the framing block to the Brain as a flow question', async () => {
    // Regression guard: the persona forbids lists and replyCarriesQuestion()
    // normalizes whitespace, so a flattened list would pass unnoticed. The
    // block must reach the client verbatim, never via the Brain.
    const seen: BrainInput[] = [];
    const spyBrain: LlmBrain = (input: BrainInput) => {
      seen.push(input);
      return { message: 'Good to see you again.' };
    };
    const coach = createCoach({
      brain: spyBrain,
      goalLog: {
        priorActionSteps: [{ action: 'Write the spec', when: '9am' }],
        framingAcceptedOn: '2026-09-01 09:00',
      },
    });
    await coach.open();
    const reply = await coach.answer('Yes, I did it.');

    expect(seen).toHaveLength(1);
    expect(seen[0]?.question).toBeUndefined();
    expect(reply.message).toContain('\n1. Ask you questions\n');
  });

  it('records the shown message, not just the acknowledgement, in the turns', async () => {
    const coach = createCoach({
      brain: echoBrain,
      goalLog: {
        priorActionSteps: [{ action: 'Write the spec', when: '9am' }],
        framingAcceptedOn: '2026-09-01 09:00',
      },
    });
    await coach.open();
    const reply = await coach.answer('Yes, I did it.');
    const lastCoachTurn = coach.state().turns.filter((t) => t.role === 'coach').at(-1);
    expect(lastCoachTurn?.text).toBe(reply.message);
  });

  it('still advances to TOWARD on the next answer', async () => {
    const coach = createCoach({ brain: echoBrain, goalLog: acceptedLog });
    await coach.open();
    const reply = await coach.answer('Got it.');
    expect(reply.phase).toBe('TOWARD');
  });
});
