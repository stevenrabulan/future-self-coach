import {
  ACTION_QUESTIONS,
  AWAY_QUESTIONS,
  FRAMING_QUESTIONS,
  TOWARD_QUESTIONS,
} from './flow-text.js';
import { assertNonBlank } from './types.js';
import type {
  ActionStep,
  BrainInput,
  CoachReply,
  ConversationState,
  GoalLog,
  LlmBrain,
  Turn,
} from './types.js';

export interface Coach {
  /** Start a Check-in: Framing Questions (+ prior Action Step recall). */
  open(): CoachReply;
  /** Feed the client's answer to the current coach message. */
  answer(text: string): CoachReply;
  /** Current conversation state (for persistence / the Goal Log). */
  state(): ConversationState;
}

export interface CreateCoachArgs {
  brain: LlmBrain;
  goalLog: GoalLog;
}

/**
 * One step of the flow: the question the coach asks next and the phase it
 * belongs to. The phase becomes the step's phase when the question is asked
 * and stays there until the client answers it.
 */
interface FlowStep {
  phase: ConversationState['phase'];
  question?: string;
}

/**
 * The fixed spine: FRAMING → TOWARD (2 questions) → AWAY (2) → ACTION (3,
 * until the client agrees to a date/time) → ENROLL (sell the step) → CLOSED.
 * Order is the Coaching Flow from CONTEXT.md; the Brain never reorders it.
 */
function flowSteps(): FlowStep[] {
  return [
    // FRAMING is asked by open(); the client's consent advances to TOWARD.
    { phase: 'FRAMING', question: FRAMING_QUESTIONS },
    ...TOWARD_QUESTIONS.map((q) => ({ phase: 'TOWARD' as const, question: q })),
    ...AWAY_QUESTIONS.map((q) => ({ phase: 'AWAY' as const, question: q })),
    ...ACTION_QUESTIONS.map((q) => ({ phase: 'ACTION' as const, question: q })),
    // ENROLL: no fixed question — the Brain sells the captured Action Step.
    { phase: 'ENROLL' },
  ];
}

/**
 * A client message that agrees to an Action Step at a date/time. The demo's
 * agreement shape names a day or clock time; if none is present the coach
 * stays in ACTION and re-asks rather than capturing a stepless commitment.
 */
/** Clock time preferred over day words ("Tomorrow at 9am" → "9am"). */
const TIME_RE = /\b(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))\b/i;
const DAY_RE =
  /\b(tomorrow|today|tonight|this afternoon|this evening|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

/** What the client's ACTION answers are building toward. */
export function extractWhen(text: string): string | undefined {
  const trimmed = text.trim();
  const time = trimmed.match(TIME_RE);
  const day = trimmed.match(DAY_RE);
  return time?.[1] ?? day?.[1];
}

/** A decline of the enrollment: reopens the date/time question. */
const DECLINE_RE =
  /\b(no\b|nope|not now|nah|i can'?t|cannot|can'?t|not ready|not sure)\b/i;

/**
 * Coach Core: maps (conversation state + Goal Log + LLM response) → next
 * coach message + current flow phase. Owns the Coaching Flow spine; the LLM
 * Brain writes only the conversational prose for the step Coach Core hands it.
 */
export function createCoach({ brain, goalLog }: CreateCoachArgs): Coach {
  if (typeof brain !== 'function') {
    throw new TypeError('createCoach: brain must be an LlmBrain function');
  }
  if (goalLog == null || !Array.isArray(goalLog.priorActionSteps)) {
    throw new TypeError(
      'createCoach: goalLog must be a GoalLog with priorActionSteps array',
    );
  }

  const steps = flowSteps();
  let turns: Turn[] = [];
  let phase: ConversationState['phase'] = 'FRAMING';
  // Index of the step most recently asked (open() asks steps[0], FRAMING).
  let stepIndex = 1;
  let actionStep: ActionStep | undefined;
  // The client's latest statement of the step itself, from ACTION q1/q2.
  let latestStepText: string | undefined;

  function record(role: Turn['role'], text: string, at: Turn['phase']): void {
    turns = [...turns, { role, text, phase: at }];
  }

  function coachTurn(
    input: Omit<BrainInput, 'state'>,
    at: Turn['phase'],
  ): CoachReply {
    const brainInput: BrainInput = { state: { turns, phase: at }, ...input };
    const { message } = brain(brainInput);
    record('coach', message, at);
    return { message, phase: at, actionStep, closed: at === 'CLOSED' };
  }

  return {
    open(): CoachReply {
      if (turns.length > 0) {
        throw new Error('coach.open() called after the Check-in already started');
      }
      const prior = goalLog.priorActionSteps.at(-1);
      const recall = prior
        ? `Last time you agreed to: "${prior.action}" at ${prior.when}. We will come back to it. `
        : '';
      record('coach', recall + FRAMING_QUESTIONS, 'FRAMING');
      return { message: recall + FRAMING_QUESTIONS, phase, closed: false };
    },

    answer(text: string): CoachReply {
      assertNonBlank(text, 'answer: client message');
      if (turns.length === 0) {
        throw new Error('answer: called before open(); run open() first');
      }
      if (phase === 'CLOSED') {
        throw new Error('answer: this Check-in is closed; open() a new one');
      }

      const at = phase;
      record('user', text, at);

      // Track the client's latest statement of the step itself (ACTION q1/q2).
      if (at === 'ACTION' && (stepIndex - 1) < steps.length && steps[stepIndex - 1]?.phase === 'ACTION' && steps[stepIndex - 1]?.question !== ACTION_QUESTIONS[ACTION_QUESTIONS.length - 1]) {
        latestStepText = text.trim();
      }

      // Post-sell: the client is confirming or declining the enrollment.
      if (phase === 'ENROLL') {
        if (DECLINE_RE.test(text)) {
          // A "no" reopens the date/time question instead of closing. The
          // final question is re-asked now, so the next pending step is
          // ENROLL (ask-next: point past the re-asked question).
          const finalQuestion = ACTION_QUESTIONS[ACTION_QUESTIONS.length - 1];
          stepIndex = steps.length - 1;
          phase = 'ACTION';
          return coachTurn({ question: finalQuestion }, 'ACTION');
        }
        const closedReply = coachTurn({}, 'CLOSED');
        phase = 'CLOSED';
        return closedReply;
      }

      const nextStep = steps[stepIndex];
      if (nextStep == null) {
        throw new Error(`answer: no flow step at index ${stepIndex} (phase ${phase})`);
      }

      // The client just answered ACTION's final question. A date/time is
      // required: without one there is no agreement to hold, so re-ask.
      if (nextStep.phase === 'ENROLL') {
        const finalQuestion = ACTION_QUESTIONS[ACTION_QUESTIONS.length - 1];
        const when = extractWhen(text);
        if (when == null) {
          return coachTurn({ question: finalQuestion }, 'ACTION');
        }
        if (latestStepText == null) {
          throw new Error(
            'answer: date/time agreed before any step text was given at ACTION',
          );
        }
        actionStep = { action: latestStepText, when };
        const sellReply = coachTurn({ actionStep }, 'ENROLL');
        phase = 'ENROLL';
        stepIndex += 1;
        return sellReply;
      }

      const reply = coachTurn({ question: nextStep.question }, nextStep.phase);
      phase = nextStep.phase;
      stepIndex += 1;
      return reply;
    },

    state(): ConversationState {
      return { turns, phase };
    },
  };
}
