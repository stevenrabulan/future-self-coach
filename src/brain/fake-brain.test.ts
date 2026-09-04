import { describe, expect, it } from 'vitest';
import { fakeBrain } from './fake-brain.js';
import { createCoach } from '../core/coach.js';
import type { BrainInput, ConversationState, GoalLog, Turn } from '../core/types.js';

const emptyGoalLog: GoalLog = { priorActionSteps: [] };

function inputFor(
  turns: Turn[],
  phase: ConversationState['phase'],
  question?: string,
): BrainInput {
  return { state: { turns, phase }, question };
}

function turnsFrom(coach: ReturnType<typeof createCoach>): Turn[] {
  return coach.state().turns;
}

describe('faked Brain: Session Goals in prose', () => {
  it('delivers the aha line with TOWARD question 2', () => {
    const coach = createCoach({ brain: fakeBrain, goalLog: emptyGoalLog });
    coach.open();
    coach.answer('Yes, go ahead.');
    coach.answer('I want the demo shipped.');

    const input = inputFor(
      turnsFrom(coach),
      'TOWARD',
      'What happens if you make it happen?',
    );
    const reply = fakeBrain(input);

    expect(reply.message).toContain('here is the aha');
    expect(reply.message).toContain('What happens if you make it happen?');
  });

  it('delivers the emotional-inspiration line with AWAY question 2', () => {
    const coach = createCoach({ brain: fakeBrain, goalLog: emptyGoalLog });
    coach.open();
    coach.answer('Yes, go ahead.');
    coach.answer('Ship the demo.');
    coach.answer('Proof.');
    coach.answer('It stays an idea.');

    const input = inputFor(
      turnsFrom(coach),
      'AWAY',
      'What happens if you successfully avoid that?',
    );
    const reply = fakeBrain(input);

    expect(reply.message).toContain('I am you, a few years out');
    expect(reply.message).toContain('What happens if you successfully avoid that?');
  });

  it('keeps other turns free of goal prose', () => {
    const reply = fakeBrain(
      inputFor([], 'TOWARD', 'What do you want most right now?'),
    );
    expect(reply.message).not.toContain('aha');
    expect(reply.message).not.toContain('a few years out');
  });

  it('sells the Action Step at ENROLL (enrollment, not description)', () => {
    const reply = fakeBrain({
      state: { turns: [], phase: 'ENROLL' },
      actionStep: { action: 'Draft the opening', when: '9am' },
    });

    expect(reply.message).toContain('Draft the opening');
    expect(reply.message).toContain('9am');
    expect(reply.message).toContain('I will hold you to it');
  });
});
