/**
 * The Coaching Flow's fixed text, from CONTEXT.md (source of truth: the
 * user's 6-Step Client Conversation Process, inspired by Eben Pagan's
 * coaching program).
 */

/**
 * The four permissions the coach asks for, phrased as bare items so the
 * questions and the reminder below can never drift apart. Punctuation and
 * lead-in are added by the two renderings, not stored here.
 */
export const FRAMING_ITEMS = [
  'Ask you questions',
  'Interrupt you to keep us on track',
  'Make requests',
  'Ask you to hold yourself accountable for what you agree to do',
] as const;

/** `1. `, `2. `, ... one item per line, so pre-wrap renders a real list. */
function numbered(items: readonly string[], suffix: string): string {
  return items.map((item, i) => `${i + 1}. ${item}${suffix}`).join('\n');
}

/**
 * Asked on a first Check-in: an ordered list, one permission per line.
 * The UI renders coach lines with `white-space: pre-wrap`, so the newlines
 * survive without a markdown renderer.
 */
export const FRAMING_QUESTIONS = `Hey, is it ok if I:\n${numbered(FRAMING_ITEMS, '?')}`;

/**
 * Shown instead of the questions once the Goal Log holds an acceptance
 * (ticket 07): the same four items, stated rather than asked, closing on the
 * agreement already made. Asking again what the client has already answered
 * is what this replaces.
 */
export const FRAMING_REMINDER =
  `Just to remind you, I will:\n${numbered(FRAMING_ITEMS, '')}\nAs we agreed.`;

export const TOWARD_QUESTIONS = [
  'What do you want most right now?',
  'What happens if you make it happen?',
] as const;

export const AWAY_QUESTIONS = [
  "What's the consequence if you don't achieve it?",
  'What happens if you successfully avoid that?',
] as const;

export const ACTION_QUESTIONS = [
  "What's your next step?",
  'What can you do first?',
  'When can you do it? Will you agree to do it, and at what date and time?',
] as const;
