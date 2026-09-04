/**
 * Faked LLM Brain for the demo: canned responses, no network (ticket 01).
 * Mirrors what the real GLM-5.3-flash Brain (ticket 02) will do with the
 * same BrainInput: persona-flavored prose around the flow question Coach
 * Core hands it.
 */
import type { BrainInput, LlmResponse } from '../core/types.js';

export function fakeBrain(input: BrainInput): LlmResponse {
  const { state, question, actionStep } = input;
  const lastUser = [...state.turns].reverse().find((t) => t.role === 'user');

  if (state.phase === 'CLOSED') {
    return {
      message:
        'Logged. This is what future-you sounds like when you keep promises to yourself. Same time next week?',
    };
  }

  if (state.phase === 'ENROLL' && actionStep != null) {
    return {
      message:
        `Then we are locked in: ${actionStep.action} at ${actionStep.when}. ` +
        'I have seen the version of you that follows through, and it is worth the discomfort. ' +
        'Say yes and I will hold you to it.',
    };
  }

  const acknowledgment =
    lastUser == null
      ? 'Good to have you here.'
      : `You said: "${lastUser.text}". I hear you.`;

  return {
    message: `${acknowledgment} ${question ?? 'Tell me more.'}`,
  };
}
