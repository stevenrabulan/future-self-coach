/**
 * The Goal Log's on-disk format (ticket 03): a small local markdown file,
 * append-only, that survives between Check-ins. The committed
 * `sample-goals.md` shows the shape without personal data; the real file is
 * `goals.local.md` (gitignored).
 *
 * Parse and append are pure string functions: (markdown) → (GoalLog) and
 * (markdown + Check-in record) → (markdown). File I/O stays in the CLI, so
 * tests run with no filesystem and the format stays the single source of
 * truth for both directions.
 *
 * Vocabulary is from CONTEXT.md: Check-in, Action Step, Goal Log.
 */
import { assertNonBlank } from '../core/types.js';
import type {
  ActionStep,
  ConversationState,
  GoalLog,
} from '../core/types.js';

/** One completed Check-in, as appended to the Goal Log. */
export interface CheckinRecord {
  /** When the Check-in happened, e.g. "2026-09-05 10:00". */
  date: string;
  /** The client's TOWARD answer: what they want most right now. */
  wantedMost: string;
  /** The client's AWAY answer: the consequence if they don't achieve it. */
  consequence: string;
  /** The enrolled Action Step with its agreed date/time. */
  actionStep: ActionStep;
  /**
   * True when this Check-in is where the client accepted the Framing
   * Questions (ticket 07). Appending it writes the `## Framing` section, so
   * later Check-ins remind instead of asking again.
   */
  framingAccepted?: boolean;
}

const HEADER = '# Goal Log';
const CHECKIN_HEADING_PREFIX = '### Check-in —';
const PLACEHOLDER = '(none yet)';
/** The `## Framing` section's single field (ticket 07). */
const ACCEPTED_FIELD = 'Accepted';

/** The starting shape of a Goal Log file with nothing recorded yet. */
export const EMPTY_GOAL_LOG_MARKDOWN =
  '# Goal Log\n\n## Notes\n\n(none yet)\n\n## Check-ins\n\n(none yet)\n';

/** A blank line, tolerant of trailing \r (editors may write CRLF). */
function isBlank(line: string): boolean {
  return line.trim() === '';
}

function stripBullet(line: string): string {
  return line.replace(/^-\s*/, '').trim();
}

/** Parses the "- Wanted most: ..." style lines of one Check-in block. */
function fieldValue(line: string, field: string): string | undefined {
  const stripped = stripBullet(line);
  const prefix = `${field}:`;
  if (!stripped.startsWith(prefix)) return undefined;
  return stripped.slice(prefix.length).trim();
}

/** Every public function in this module requires a real Goal Log file. */
function assertIsGoalLog(markdown: string, fnName: string): void {
  if (!markdown.includes(HEADER)) {
    throw new Error(
      `${fnName}: not a Goal Log file (expected a "${HEADER}" header)`,
    );
  }
}

/**
 * Parses a Goal Log markdown file into the coach's GoalLog view. Fails fast
 * and loudly: on a file without the Goal Log header, and on any Check-in
 * block that lacks its Action Step or Agreed date/time line — a corrupted
 * block is never silently dropped from recall.
 */
export function parseGoalLog(markdown: string): GoalLog {
  assertIsGoalLog(markdown, 'parseGoalLog');

  const lines = markdown.split('\n');
  const priorActionSteps: ActionStep[] = [];
  const noteLines: string[] = [];

  let framingAcceptedOn: string | undefined;

  let section: 'none' | 'notes' | 'checkins' | 'framing' = 'none';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith('## ')) {
      const title = line.slice(3).trim();
      section =
        title === 'Notes' ? 'notes'
        : title === 'Check-ins' ? 'checkins'
        : title === 'Framing' ? 'framing'
        : 'none';
      continue;
    }
    if (section === 'framing') {
      if (isBlank(line) || stripBullet(line) === PLACEHOLDER) continue;
      const accepted = fieldValue(line, ACCEPTED_FIELD);
      // Only the first Accepted line counts: the acceptance date is the
      // original one, never overwritten by a later Check-in.
      if (accepted != null && accepted !== PLACEHOLDER && framingAcceptedOn == null) {
        framingAcceptedOn = accepted;
      }
      continue;
    }
    if (section === 'notes') {
      if (isBlank(line) || stripBullet(line) === PLACEHOLDER) continue;
      noteLines.push(stripBullet(line));
      continue;
    }
    if (section === 'checkins' && line.startsWith(CHECKIN_HEADING_PREFIX)) {
      // Scan forward from this heading by index (never lines.indexOf: two
      // identical headings would make indexOf find the first one).
      let action: string | undefined;
      let when: string | undefined;
      let j = i + 1;
      for (; j < lines.length; j++) {
        const blockLine = lines[j]!;
        if (blockLine.startsWith(CHECKIN_HEADING_PREFIX) || blockLine.startsWith('## ')) break;
        const a = fieldValue(blockLine, 'Action Step');
        if (a != null) action = a;
        const w = fieldValue(blockLine, 'Agreed date/time');
        if (w != null) when = w;
      }
      if (
        action == null || action === PLACEHOLDER ||
        when == null || when === PLACEHOLDER
      ) {
        throw new Error(
          `parseGoalLog: Check-in block at line ${i + 1} is missing its ` +
            'Action Step or Agreed date/time line (corrupted Goal Log?)',
        );
      }
      priorActionSteps.push({ action, when });
      i = j - 1;
    }
  }

  const goalLog: GoalLog = { priorActionSteps };
  if (noteLines.length > 0) goalLog.notes = noteLines.join('\n');
  if (framingAcceptedOn != null) goalLog.framingAcceptedOn = framingAcceptedOn;
  return goalLog;
}

/** Validates the record before it touches the file; fails fast and loudly. */
function assertValidRecord(record: CheckinRecord, fnName: string): void {
  if (record == null || typeof record !== 'object') {
    throw new TypeError(`${fnName}: record must be a CheckinRecord`);
  }
  if (record.actionStep == null || typeof record.actionStep !== 'object') {
    throw new TypeError(`${fnName}: record.actionStep must be an ActionStep`);
  }
  assertNonBlank(record.date, `${fnName}: record.date`);
  assertNonBlank(record.wantedMost, `${fnName}: record.wantedMost`);
  assertNonBlank(record.consequence, `${fnName}: record.consequence`);
  assertNonBlank(record.actionStep.action, `${fnName}: record.actionStep.action`);
  assertNonBlank(record.actionStep.when, `${fnName}: record.actionStep.when`);
}

/**
 * Derives the Check-in record to append from a closed Check-in's state.
 * The wantedMost / consequence answers come from the TOWARD/AWAY user turns;
 * the Action Step comes from the state Coach Core exposes once captured.
 * Fails loudly on any missing piece: an outcome without its parts is not
 * appendable.
 */
export function recordFromState(
  state: ConversationState,
  date: string,
): CheckinRecord {
  if (state == null || typeof state !== 'object') {
    throw new TypeError('recordFromState: state must be a ConversationState');
  }
  if (state.actionStep == null) {
    throw new Error(
      `recordFromState: the Check-in has no Action Step yet (phase ${state.phase}) — ` +
        'an outcome is appendable only after enrollment',
    );
  }
  const wantedMost = assertNonBlank(
    state.turns.find((t) => t.role === 'user' && t.phase === 'TOWARD')?.text,
    'recordFromState: TOWARD answer (wanted most)',
  );
  const consequence = assertNonBlank(
    state.turns.find((t) => t.role === 'user' && t.phase === 'AWAY')?.text,
    'recordFromState: AWAY answer (consequence)',
  );
  const result: CheckinRecord = {
    date,
    wantedMost,
    consequence,
    actionStep: state.actionStep,
  };
  if (state.framingAccepted === true) result.framingAccepted = true;
  return result;
}

/** Renders one Check-in block in the file's markdown shape. */
function renderCheckin(record: CheckinRecord): string {
  return [
    `${CHECKIN_HEADING_PREFIX} ${record.date}`,
    '',
    `- Wanted most: ${record.wantedMost}`,
    `- Consequence: ${record.consequence}`,
    `- Action Step: ${record.actionStep.action}`,
    `- Agreed date/time: ${record.actionStep.when}`,
  ].join('\n');
}

/**
 * Inserts the `## Framing` section recording when the client accepted the
 * Framing Questions (ticket 07). Idempotent: a log that already holds an
 * acceptance is returned untouched, so the date stays the original one.
 * The section goes directly after the `# Goal Log` header, above Notes and
 * Check-ins, since it describes the relationship rather than any one
 * Check-in.
 */
function withFramingAcceptance(markdown: string, date: string): string {
  if (parseGoalLog(markdown).framingAcceptedOn != null) return markdown;
  const lines = markdown.split('\n');
  const headerIndex = lines.findIndex((line) => line.trim() === HEADER);
  if (headerIndex === -1) {
    throw new Error(
      `withFramingAcceptance: no "${HEADER}" header line to insert after`,
    );
  }
  const section = ['', '## Framing', '', `- ${ACCEPTED_FIELD}: ${date}`];
  return [
    ...lines.slice(0, headerIndex + 1),
    ...section,
    ...lines.slice(headerIndex + 1),
  ].join('\n');
}

/**
 * Appends one completed Check-in to the Goal Log markdown, append-only:
 * every existing byte is preserved and the new block goes at the end (so
 * file order stays oldest-first). Trailing whitespace is trimmed only to
 * place the new block cleanly. A record carrying a Framing acceptance also
 * adds the `## Framing` section, once.
 */
export function appendCheckin(markdown: string, record: CheckinRecord): string {
  assertIsGoalLog(markdown, 'appendCheckin');
  assertValidRecord(record, 'appendCheckin');
  const withFraming =
    record.framingAccepted === true
      ? withFramingAcceptance(markdown, record.date)
      : markdown;
  const body = withFraming.replace(/\s+$/, '');
  return `${body}\n\n${renderCheckin(record)}\n`;
}