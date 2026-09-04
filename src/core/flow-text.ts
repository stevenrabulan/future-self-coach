/**
 * The Coaching Flow's fixed text, from CONTEXT.md (source of truth: the
 * user's 6-Step Client Conversation Process, inspired by Eben Pagan's
 * coaching program).
 */

export const FRAMING_QUESTIONS = [
  'OK to ask questions?',
  'OK to interrupt to keep us on track?',
  'OK to make requests?',
  'OK to ask you to hold yourself accountable for what you agree to do?',
].join(' ');

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
