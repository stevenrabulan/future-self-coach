/**
 * Shared types for the Coach Core seam.
 *
 * The seam (spec: "Testing Decisions"): (conversation state + Goal Log +
 * LLM response) → (next coach message + current flow phase).
 *
 * Vocabulary is from CONTEXT.md: Check-in, Coaching Flow, Framing Questions,
 * Action Step, Goal Log, Coach Persona, Session Goals.
 */

/** Flow phases in conversational order. RECALL (when the Goal Log has a
 * prior Action Step) opens the Check-in; Framing follows. */
export type FlowPhase =
  | 'RECALL'
  | 'FRAMING'
  | 'TOWARD'
  | 'AWAY'
  | 'ACTION'
  | 'ENROLL'
  | 'CLOSED';

/** One turn in a Check-in conversation. */
export interface Turn {
  role: 'coach' | 'user';
  text: string;
  /** Phase the conversation was in when this turn was produced/answered. */
  phase: FlowPhase;
}

/** A completed Action Step recorded from a prior Check-in. */
export interface ActionStep {
  /** What the client agreed to do. */
  action: string;
  /** Agreed date/time, e.g. "2026-09-05 09:00". */
  when: string;
}

/** The Goal Log: the coach's view of the client's goals and history. */
export interface GoalLog {
  /** Prior Action Steps, oldest first. Empty on a first Check-in. */
  priorActionSteps: ActionStep[];
  /** Optional free-form notes on current goals/values/deadlines. */
  notes?: string;
}

/** Conversation state for one Check-in. */
export interface ConversationState {
  turns: Turn[];
  phase: FlowPhase;
  /**
   * The enrolled Action Step once the Check-in has captured one (from ENROLL
   * on). This is what the Goal Log append records (ticket 03).
   */
  actionStep?: ActionStep;
}

/**
 * What an LLM Brain returns for one coach turn. The real Brain (ticket 02)
 * and the faked Brain both implement this.
 */
export interface LlmResponse {
  message: string;
}

/**
 * What an LLM Brain receives for one coach turn. Coach Core decides the
 * phase and the exact flow question; the Brain writes only the prose around
 * it. The real Brain (ticket 02) and the faked Brain both take this shape.
 */
export interface BrainInput {
  state: ConversationState;
  /** The exact flow question the coach message must ask, if any. */
  question?: string;
  /** Set at ENROLL: the Action Step the client is being enrolled in. */
  actionStep?: ActionStep;
}

/**
 * The single seam: an LLM Brain produces a coach message for the current
 * state. Coach Core consumes this; nothing else touches an LLM. Async since
 * ticket 02 (the real Brain calls a hosted API); the faked Brains simply
 * return resolved promises.
 */
export type LlmBrain = (input: BrainInput) => LlmResponse | Promise<LlmResponse>;

/** What Coach Core produces each step. */
export interface CoachReply {
  message: string;
  phase: FlowPhase;
  /** Present once the Check-in has produced an enrolled Action Step. */
  actionStep?: ActionStep;
  /** True when the Check-in is complete (post-enrollment wrap-up sent). */
  closed: boolean;
}

export function assertNonBlank(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${name} must be a non-empty string, got: ${JSON.stringify(value)}`);
  }
  return value;
}
