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
function runFullCheckin(
  coach: ReturnType<typeof createCoach>,
  answers: string[],
): CoachReply[] {
  const replies: CoachReply[] = [coach.open()];
  for (const a of answers) replies.push(coach.answer(a));
  return replies;
}

describe('Coach Core: flow spine TOWARD → AWAY → ACTION', () => {
  it('runs Framing, then TOWARD before AWAY, AWAY before ACTION, in order', () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    const replies = runFullCheckin(coach, [
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

  it('asks the Framing Questions first and the exact TOWARD/AWAY/ACTION questions after', () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    const replies = runFullCheckin(coach, [
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
    expect(framing.message).toContain('OK to ask questions?');
    expect(framing.message).toContain('OK to interrupt to keep us on track?');
    expect(framing.message).toContain('OK to make requests?');
    expect(framing.message).toContain('OK to ask you to hold yourself accountable');

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
  function checkinToAgreement() {
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
    const replies = [coach.open()];
    for (const a of answers) replies.push(coach.answer(a));
    return { coach, replies };
  }

  it('captures an Action Step with an agreed date/time at ACTION', () => {
    const { replies } = checkinToAgreement();
    const enroll = replies.at(-1)!;

    expect(enroll.phase).toBe('ENROLL');
    // The step is the latest step text given at ACTION (q2), tied to the
    // agreed date/time parsed from the final answer.
    expect(enroll.actionStep).toEqual({
      action: 'Write the opening.',
      when: '9am',
    });
  });

  it('the coach sells and enrolls the client rather than only describing', () => {
    const { replies } = checkinToAgreement();
    const enroll = replies.at(-1)!;

    // The canned Brain's ENROLL message re-states the step and asks for the
    // yes: enrollment, not description. Coach Core must hand it the step.
    expect(enroll.message).toContain('I am holding you to it');
    expect(enroll.message).toContain('Are you in?');
  });

  it('reopens the date/time question when the client declines the sell', () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    coach.open();
    for (const a of ['Yes.', 'Ship the demo.', 'Proof.', 'It stays an idea.', 'Another quiet quarter.', 'Write the outline.', 'Draft the opening.', 'Tomorrow at 9am.']) {
      coach.answer(a);
    }
    const no = coach.answer('No, I cannot do that day.');
    expect(no.phase).toBe('ACTION');
    expect(no.message).toContain('When can you do it?');
    // A later agreement still closes the Check-in.
    const retry = coach.answer('Thursday at 2pm.');
    expect(retry.phase).toBe('ENROLL');
    expect(retry.actionStep).toEqual({ action: 'Draft the opening.', when: '2pm' });
  });

  it('closes the Check-in after the enrollment confirmation', () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    let last: CoachReply | undefined;
    coach.open();
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
      last = coach.answer(a);
    }
    expect(last!.phase).toBe('CLOSED');
    expect(last!.closed).toBe(true);
  });

  it('stays in ACTION and re-asks when the client has not agreed to a date/time', () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    coach.open();
    for (const a of ['Yes.', 'Ship the demo.', 'Proof.', 'It stays an idea.', 'Another quiet quarter.', 'Write the outline.', 'Write the opening.']) {
      coach.answer(a);
    }
    const dodge = coach.answer('I am not sure when yet.');
    expect(dodge.phase).toBe('ACTION');
    expect(dodge.actionStep).toBeUndefined();
    expect(dodge.message).toContain('When can you do it?');
  });
});

describe('Coach Core: Goal Log integration', () => {
  it('surfaces the prior Action Step from the Goal Log at the start', () => {
    const coach = createCoach({
      brain: scriptedBrain(),
      goalLog: {
        priorActionSteps: [
          { action: 'Draft the demo spec', when: '2026-09-04 09:00' },
        ],
      },
    });

    const reply = coach.open();

    expect(reply.message).toContain('Draft the demo spec');
    expect(reply.message).toContain('2026-09-04 09:00');
  });

  it('records the full conversation in state for the Goal Log append', () => {
    const coach = createCoach({ brain: scriptedBrain(), goalLog: emptyGoalLog });
    coach.open();
    coach.answer('Yes.');
    coach.answer('Ship the demo.');

    const state = coach.state();
    expect(state.phase).toBe('TOWARD');
    expect(state.turns[0]).toMatchObject({ role: 'coach', phase: 'FRAMING' });
    expect(state.turns.filter((t) => t.role === 'user')).toHaveLength(2);
    expect(state.turns.at(-1)).toMatchObject({ role: 'coach', phase: 'TOWARD' });
  });
});
