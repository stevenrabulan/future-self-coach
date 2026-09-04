/**
 * Faked LLM Brain for the demo: canned responses, no network (ticket 01).
 * Mirrors what the real GLM-5.3-flash Brain (ticket 02) will do with the
 * same BrainInput: persona-flavored prose around the flow question Coach
 * Core hands it.
 *
 * Decision (2026-09-04, ticket 01 comment): the aha-moment and
 * emotional-inspiration Session Goals are pursued in Brain prose, NOT as
 * explicit flow steps — the canned lines below show where the real Brain's
 * prompt is expected to produce them (TOWARD q2 → aha, AWAY q2 → emotional
 * weight).
 */
import type { BrainInput, LlmResponse } from '../core/types.js';
import { AWAY_QUESTIONS, TOWARD_QUESTIONS } from '../core/flow-text.js';

/** The canned aha line: an insight the client could not see alone. */
const AHA_LINE =
  'And here is the aha: the demo was never the point. The point is who you ' +
  'become once you are someone who ships. ';

/** The canned emotional line: the future self making avoidance feel real. */
const INSPIRATION_LINE =
  'Sit with that for a second. I am you, a few years out, and I am telling ' +
  'you: the quiet quarters are the only thing we cannot survive. ';

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

  // Session Goals land here in prose: aha on TOWARD q2, emotional weight on
  // AWAY q2. The real Brain's prompt (ticket 02) carries the same aims.
  let goals = '';
  if (question === TOWARD_QUESTIONS[1]) goals = AHA_LINE;
  if (question === AWAY_QUESTIONS[1]) goals = INSPIRATION_LINE;

  return {
    message: `${acknowledgment} ${goals}${question ?? 'Tell me more.'}`,
  };
}
