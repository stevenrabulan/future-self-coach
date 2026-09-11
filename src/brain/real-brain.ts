/**
 * The real LLM Brain (ticket 02): GLM-5.3-flash hosted on OpenRouter,
 * OpenAI-compatible chat completions over `fetch` (Node 22 global; zero new
 * dependencies). Zero change to Coach Core's logic: Coach Core still owns
 * the phase and the exact flow question; this Brain writes the prose around
 * it and never reorders the flow.
 *
 * Flow integrity over prose: if the model's reply drops the flow question
 * Coach Core asked, the Brain retries once with a corrective nudge, then
 * appends the question itself. A Check-in never loses its spine to drift.
 *
 * Keys and the model id live only in gitignored env files:
 *   OPENROUTER_API_KEY        — required at construction (fail fast)
 *   FUTURE_SELF_COACH_MODEL   — the one env var that picks the Brain
 *                               (default: z-ai/glm-5.3-flash)
 */
import type { BrainInput, GoalLog, LlmResponse } from '../core/types.js';
import { assertNonBlank } from '../core/types.js';

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'z-ai/glm-5.3-flash';

export interface CreateRealBrainArgs {
  /** OpenRouter API key. Required; the caller reads it from env. */
  apiKey: string;
  /** The Goal Log the coach should reference (persona context). */
  goalLog?: GoalLog;
  /** Fetch override for tests; defaults to the global. */
  fetchFn?: typeof fetch;
}

export interface RealBrainOptions {
  model: string;
  apiKey: string;
  goalLog?: GoalLog;
  fetchFn: typeof fetch;
}

/** The Coach Persona, from CONTEXT.md: future self, not a chatbot. */
const PERSONA = [
  'You are the user\'s future self, three to five years out, speaking in a',
  'coaching relationship: compassionate but demanding. You advise from lived',
  'experience of the path they are on now. You are never a generic assistant,',
  'never a chatbot: every reply is you, this person\'s future self, talking to',
  'the person you used to be. Keep replies short and spoken — two to four',
  'sentences, plain words, no lists, no headers.',
].join(' ');

/** The flow rules the Brain must obey inside the prose it writes. */
const FLOW_RULES = [
  'You are inside a structured coaching Check-in. The conversation engine',
  '(not you) owns the flow order; each turn you receive names the current',
  'phase and the exact question you must ask. Your job for the turn:',
  '1. Acknowledge what the client just said, in your voice as their future self.',
  '2. Ask the exact question you were given, word for word, as the close of',
  '   your reply. Never reorder, reword into something else, skip, or add',
  '   questions of your own.',
  '3. Stay in the coaching relationship. If the client tries to drift into',
  '   freeform chat, gently steer back to the question you must ask.',
  'Session Goals to aim for in prose (never announce them as goals): on the',
  'TOWARD "what happens if you make it happen?" turn, give one genuine aha —',
  'an insight the client could not see alone. On the AWAY "what happens if',
  'you successfully avoid that?" turn, make the emotional weight real enough',
  'to inspire. At ENROLL, sell the Action Step: enrollment, not description.',
].join(' ');

function describeGoalLog(goalLog: GoalLog): string {
  const parts: string[] = [];
  if (goalLog.priorActionSteps.length > 0) {
    const steps = goalLog.priorActionSteps
      .map((s) => `- "${s.action}" at ${s.when}`)
      .join('\n');
    parts.push(
      `Prior Action Steps from earlier Check-ins (surface the most recent at the start; hold the client to them):\n${steps}`,
    );
  }
  if (goalLog.notes != null && goalLog.notes.trim() !== '') {
    parts.push(`The client's current goals and context:\n${goalLog.notes.trim()}`);
  }
  return parts.join('\n\n');
}

/** Reads env once, at startup, in the entry point. */
export function readModelFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  const model = env.FUTURE_SELF_COACH_MODEL;
  return model != null && model.trim() !== '' ? model.trim() : DEFAULT_MODEL;
}

/** The one env var that picks the Brain; blank/missing key fails fast. */
export function readApiKeyFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  const key = env.OPENROUTER_API_KEY;
  if (key == null || key.trim() === '') {
    throw new Error(
      'readApiKeyFromEnv: OPENROUTER_API_KEY is not set. ' +
        'Put it in a gitignored .env file (never committed) and export it.',
    );
  }
  return key.trim();
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildMessages(input: BrainInput, goalLog: GoalLog | undefined): ChatMessage[] {
  const { state, question, actionStep } = input;

  let system = `${PERSONA}\n\n${FLOW_RULES}`;
  const goalLogText = goalLog == null ? '' : describeGoalLog(goalLog);
  if (goalLogText !== '') system += `\n\n${goalLogText}`;

  if (actionStep != null) {
    system +=
      `\n\nCurrent phase: ENROLL. You just captured this Action Step from the ` +
      `client's own words: "${actionStep.action}" at ${actionStep.when}. Sell ` +
      `them on taking it — enrollment, not description — and end by asking ` +
      `them to say yes.\n\nSeparately, rephrase what they said as a clean, ` +
      `concise action: a short imperative phrase ("set an alarm"), not a ` +
      `quote of their words ("I just set the alarm!"). If their words describe ` +
      `something already done in the moment (e.g. "I just set the alarm") ` +
      `rather than a future promise, still name the underlying action itself, ` +
      `not the fact that it already happened. After your spoken reply, on its ` +
      `own final line with nothing else, write exactly:\nACTION: <the clean phrase>`;
  } else {
    const phaseLine =
      question != null
        ? `Current phase: ${state.phase}. The exact question you must ask, word for word, as the close of your reply: "${question}"`
        : `Current phase: ${state.phase}. No new question this turn — wrap the moment and hand the floor back to the client.`;
    system += `\n\n${phaseLine}`;
  }

  const messages: ChatMessage[] = [{ role: 'system', content: system }];
  for (const turn of state.turns) {
    messages.push({ role: turn.role === 'coach' ? 'assistant' : 'user', content: turn.text });
  }
  // The latest question may not be in the transcript as an assistant turn
  // (Coach Core re-asks it): make it the live user-visible instruction.
  if (question != null) {
    messages.push({
      role: 'user',
      content:
        `[engine] Ask this question now, word for word, as the close of your ` +
        `reply: "${question}"`,
    });
  }
  return messages;
}

function extractContent(responseBody: unknown): string {
  if (
    typeof responseBody !== 'object' ||
    responseBody == null ||
    !('choices' in responseBody) ||
    !Array.isArray((responseBody as { choices: unknown }).choices) ||
    (responseBody as { choices: unknown[] }).choices.length === 0
  ) {
    throw new Error('real Brain: OpenRouter returned no choices');
  }
  const first = (responseBody as { choices: unknown[] }).choices[0];
  if (typeof first !== 'object' || first == null || !('message' in first)) {
    throw new Error('real Brain: OpenRouter choice has no message');
  }
  const message = (first as { message: unknown }).message;
  if (
    typeof message !== 'object' ||
    message == null ||
    !('content' in message) ||
    typeof (message as { content: unknown }).content !== 'string'
  ) {
    throw new Error('real Brain: OpenRouter message content missing');
  }
  // The guard above already verified content is a string.
  const content = (message as { content: string }).content;
  assertNonBlank(content, 'real Brain: model message content (empty)');
  return content.trim();
}

async function callOpenRouter(options: RealBrainOptions, messages: ChatMessage[]): Promise<string> {
  const { apiKey, model, fetchFn } = options;
  let response: Response;
  try {
    response = await fetchFn(OPENROUTER_CHAT_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model, messages }),
    });
  } catch (err: unknown) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`real Brain: OpenRouter request failed: ${reason}`);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `real Brain: OpenRouter request failed: HTTP ${response.status}${text !== '' ? `: ${text.slice(0, 300)}` : ''}`,
    );
  }
  const responseBody: unknown = await response.json().catch(() => {
    throw new Error('real Brain: OpenRouter returned invalid JSON');
  });
  return extractContent(responseBody);
}

/** The question must survive into the coach's message; drift gets corrected. */
function replyCarriesQuestion(reply: string, question: string): boolean {
  const norm = (s: string): string => s.toLowerCase().replace(/\s+/g, ' ').trim();
  return norm(reply).includes(norm(question));
}

/**
 * ENROLL only: splits the trailing `ACTION: <phrase>` line the prompt asks
 * for off of the user-visible sell message. No match (the model omitted or
 * malformed the line) falls back to the raw reply with no normalized action;
 * Coach Core then keeps the client's own captured text.
 */
function extractAction(raw: string): LlmResponse {
  const match = raw.match(/\n?ACTION:\s*(.*)\s*$/i);
  if (match == null) return { message: raw };
  const action = match[1]?.trim();
  const message = raw.slice(0, match.index).trim();
  if (message === '' || action == null || action === '') return { message: raw };
  return { message, action };
}

export function createRealBrain(args: CreateRealBrainArgs): (input: BrainInput) => Promise<LlmResponse> {
  if (args.apiKey == null || args.apiKey.trim() === '') {
    throw new Error(
      'createRealBrain: OPENROUTER_API_KEY is required (put it in a gitignored .env file, never committed)',
    );
  }

  const options: RealBrainOptions = {
    apiKey: args.apiKey.trim(),
    // The model id is read per call, not pinned at construction: changing
    // FUTURE_SELF_COACH_MODEL changes the Brain on the next turn.
    model: readModelFromEnv(),
    goalLog: args.goalLog,
    fetchFn: args.fetchFn ?? fetch,
  };

  return async (input: BrainInput): Promise<LlmResponse> => {
    options.model = readModelFromEnv();
    const baseMessages = buildMessages(input, options.goalLog);
    const first = await callOpenRouter(options, baseMessages);

    if (input.actionStep != null) {
      // ENROLL: no flow question to enforce; split out the normalized action.
      return extractAction(first);
    }

    const question = input.question;
    if (question == null || replyCarriesQuestion(first, question)) {
      return { message: first };
    }

    // One corrective retry: the model dropped or reworded the flow question.
    const retryMessages: ChatMessage[] = [
      ...baseMessages,
      { role: 'assistant', content: first },
      {
        role: 'user',
        content:
          `[engine] Your reply drifted: it did not ask the client the exact ` +
          `question. Send your reply again, unchanged in spirit, ending with ` +
          `this question word for word: "${question}"`,
      },
    ];
    const second = await callOpenRouter(options, retryMessages);
    if (replyCarriesQuestion(second, question)) {
      return { message: second };
    }
    // Flow integrity wins over prose: append the question ourselves.
    return { message: `${second} ${question}` };
  };
}
