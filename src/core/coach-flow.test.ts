import { describe, expect, it } from 'vitest';
import { createCoach } from './coach.js';
import type { BrainInput, CoachReply, GoalLog, LlmBrain } from './types.js';

/**
 * Scripted fake Brain: echoes the phase and the exact flow question Coach
 * Core hands it. This models the real Brain (ticket 02: GLM-5.3-flash
 * prompted with the same phase + question) without any network.
 */
function scriptedBrain(): LlmBrain {
  return ({ state, question, actionStep }: BrainInput) => {
    if (state.phase === 'ENROLL' && actionStep) {
      return {
        message: `[enroll] You said ${actionStep.action} at ${actionStep.when}. I am holding you to it. Are you in?`,
      };
    }
    if (state.phase === 'CLOSED') {
      return { message: '[closed] Check-in logged. See you at the next one.' };
    }
    return { message: `[${state.phase}] ${question ?? ''}` };
  };
}

const emptyGoalLog: GoalLog = { priorActionSteps: [] };

/** Drive a full Check-in with one answer per flow question. */
async function runFullCheckin(
  coach: ReturnType<typeof createCoach>,
  answers: string[],
): Promise<CoachReply[]> {
  const replies: CoachReply[] = [await coach.open()];
  for (const a of answers) replies.push(await coach.answer(a));
  return replies;
}

describe('Coach Core: flow spine TOWARD → AWAY → ACTION', () => {
  it('runs Framing, then TOWARD before AWAY, AWAY before ACTION, in order', async () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    const replies = await runFullCheckin(coach, [
      'Yes, go ahead.', // consent to Framing
      'Ship the demo.', // TOWARD q1: what do you want most
      'Proof the idea works.', // TOWARD q2: what happens if you make it happen
      'It stays an idea.', // AWAY q1: consequence if you don't
      'Another quiet quarter.', // AWAY q2: if you avoid that
      'Write the demo outline.', // ACTION q1: next step
      'Write the opening.', // ACTION q2: first thing
      'Tomorrow at 9am.', // ACTION q3: when — and the agreement
      'Agreed.', // enrollment confirmation
    ]);

    const phases = replies.map((r) => r.phase);
    expect(phases).toEqual([
      'FRAMING',
      'TOWARD',
      'TOWARD',
      'AWAY',
      'AWAY',
      'ACTION',
      'ACTION',
      'ACTION',
      'ENROLL',
      'CLOSED',
    ]);
  });

  it('asks the Framing Questions first and the exact TOWARD/AWAY/ACTION questions after', async () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    const replies = await runFullCheckin(coach, [
      'Yes.',
      'Ship the demo.',
      'Proof.',
      'It stays an idea.',
      'Another quiet quarter.',
      'Write the outline.',
      'Write the opening.',
      'Tomorrow at 9am.',
      'Agreed.',
    ]);
    const [framing, toward1, toward2, away1, away2, action1, action2, action3] =
      replies as [
        CoachReply,
        CoachReply,
        CoachReply,
        CoachReply,
        CoachReply,
        CoachReply,
        CoachReply,
        CoachReply,
      ];
    expect(framing.message).toContain('1. Ask you questions?');
    expect(framing.message).toContain('2. Interrupt you to keep us on track?');
    expect(framing.message).toContain('3. Make requests?');
    expect(framing.message).toContain('4. Ask you to hold yourself accountable');

    expect(toward1.message).toContain('What do you want most right now?');
    expect(toward2.message).toContain('What happens if you make it happen?');
    expect(away1.message).toContain(
      "What's the consequence if you don't achieve it?",
    );
    expect(away2.message).toContain(
      'What happens if you successfully avoid that?',
    );
    expect(action1.message).toContain("What's your next step?");
    expect(action2.message).toContain('What can you do first?');
    expect(action3.message).toContain('When can you do it?');
    expect(action3.message).toMatch(/will you agree to do it/i);
  });
});

describe('Coach Core: Action Step capture and enrollment', () => {
  async function checkinToAgreement() {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    const answers = [
      'Yes.',
      'Ship the demo.',
      'Proof.',
      'It stays an idea.',
      'Another quiet quarter.',
      'Write the outline.',
      'Write the opening.',
      'Tomorrow at 9am.',
    ];
    const replies = [await coach.open()];
    for (const a of answers) replies.push(await coach.answer(a));
    return { coach, replies };
  }

  it('captures an Action Step with an agreed date/time at ACTION', async () => {
    const { replies } = await checkinToAgreement();
    const enroll = replies.at(-1)!;

    expect(enroll.phase).toBe('ENROLL');
    // The step is the latest step text given at ACTION (q2), tied to the
    // agreed date/time parsed from the final answer.
    expect(enroll.actionStep).toEqual({
      action: 'Write the opening.',
      when: '9am',
    });
  });

  it('the coach sells and enrolls the client rather than only describing', async () => {
    const { replies } = await checkinToAgreement();
    const enroll = replies.at(-1)!;

    // The canned Brain's ENROLL message re-states the step and asks for the
    // yes: enrollment, not description. Coach Core must hand it the step.
    expect(enroll.message).toContain('I am holding you to it');
    expect(enroll.message).toContain('Are you in?');
  });

  it('reopens the date/time question when the client declines the sell', async () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    await coach.open();
    for (const a of ['Yes.', 'Ship the demo.', 'Proof.', 'It stays an idea.', 'Another quiet quarter.', 'Write the outline.', 'Draft the opening.', 'Tomorrow at 9am.']) {
      await coach.answer(a);
    }
    const no = await coach.answer('No, I cannot do that day.');
    expect(no.phase).toBe('ACTION');
    expect(no.message).toContain('When can you do it?');
    // A later agreement still closes the Check-in.
    const retry = await coach.answer('Thursday at 2pm.');
    expect(retry.phase).toBe('ENROLL');
    expect(retry.actionStep).toEqual({ action: 'Draft the opening.', when: '2pm' });
  });

  it('closes the Check-in after the enrollment confirmation', async () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    let last: CoachReply | undefined;
    await coach.open();
    for (const a of [
      'Yes.',
      'Ship the demo.',
      'Proof.',
      'It stays an idea.',
      'Another quiet quarter.',
      'Write the outline.',
      'Write the opening.',
      'Tomorrow at 9am.',
      'Agreed.',
    ]) {
      last = await coach.answer(a);
    }
    expect(last!.phase).toBe('CLOSED');
    expect(last!.closed).toBe(true);
  });

  it("uses the Brain's normalized action over the client's raw ACTION-answer text", async () => {
    const brain: LlmBrain = ({ state, question, actionStep }: BrainInput) => {
      if (state.phase === 'ENROLL' && actionStep) {
        // Mirrors the real Brain: sells the step and returns a clean phrase
        // for what the client's raw words ("I just set the alarm!") meant.
        return {
          message: `Locked in: ${actionStep.action} at ${actionStep.when}. Are you in?`,
          action: 'set an alarm',
        };
      }
      if (state.phase === 'CLOSED') return { message: '[closed]' };
      return { message: `[${state.phase}] ${question ?? ''}` };
    };
    const coach = createCoach({ brain, goalLog: emptyGoalLog });
    await coach.open();
    let enroll;
    for (const a of ['Yes.', 'Ship the demo.', 'Proof.', 'It stays an idea.', 'Another quiet quarter.', 'The first thing I can do is set an alarm.', 'I just set the alarm!', 'Tonight.']) {
      enroll = await coach.answer(a);
    }

    expect(enroll!.phase).toBe('ENROLL');
    expect(enroll!.actionStep).toEqual({ action: 'set an alarm', when: 'Tonight' });
  });

  it('stays in ACTION and re-asks when the client has not agreed to a date/time', async () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    await coach.open();
    for (const a of ['Yes.', 'Ship the demo.', 'Proof.', 'It stays an idea.', 'Another quiet quarter.', 'Write the outline.', 'Write the opening.']) {
      await coach.answer(a);
    }
    const dodge = await coach.answer('I am not sure when yet.');
    expect(dodge.phase).toBe('ACTION');
    expect(dodge.actionStep).toBeUndefined();
    expect(dodge.message).toContain('When can you do it?');
  });
});

describe('Coach Core: Goal Log integration', () => {
  it('surfaces the prior Action Step from the Goal Log at the start', async () => {
    const coach = createCoach({
      brain: scriptedBrain(),
      goalLog: {
        priorActionSteps: [
          { action: 'Draft the demo spec', when: '2026-09-04 09:00' },
        ],
      },
    });

    const reply = await coach.open();

    expect(reply.message).toContain('Draft the demo spec');
    expect(reply.message).toContain('2026-09-04 09:00');
  });

  it('records the full conversation in state for the Goal Log append', async () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    await coach.open();
    await coach.answer('Yes.');
    await coach.answer('Ship the demo.');

    const state = coach.state();
    expect(state.phase).toBe('TOWARD');
    expect(state.turns[0]).toMatchObject({ role: 'coach', phase: 'FRAMING' });
    expect(state.turns.filter((t) => t.role === 'user')).toHaveLength(2);
    expect(state.turns.at(-1)).toMatchObject({ role: 'coach', phase: 'TOWARD' });
  });
});
