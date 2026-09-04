/**
 * Terminal Check-in loop: runs a full Check-in against the real LLM Brain
 * (ticket 02: GLM-5.3-flash via OpenRouter) when OPENROUTER_API_KEY is set,
 * falling back to the faked Brain with a clear notice when it is not.
 * `npm run checkin` — text-only, no voice, no UI.
 *
 * Reads stdin line-by-line, so it works both interactive (TTY) and piped
 * (scripted demo). On piped EOF mid-flow the coach finishes with the
 * questions it can still ask, and the run ends cleanly.
 */
import { createCoach } from '../core/coach.js';
import type { Coach } from '../core/coach.js';
import { fakeBrain } from '../brain/fake-brain.js';
import { createRealBrain, readApiKeyFromEnv, readModelFromEnv } from '../brain/real-brain.js';
import { appendCheckin, EMPTY_GOAL_LOG_MARKDOWN, parseGoalLog, recordFromState } from '../log/goal-log.js';
import type { CoachReply, GoalLog, LlmBrain } from '../core/types.js';
import { createInterface } from 'node:readline';
import { stdin } from 'node:process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/** The local, gitignored Goal Log; the committed sample-goals.md shows the shape. */
const GOAL_LOG_PATH = 'goals.local.md';

/**
 * Loads the Goal Log from goals.local.md. Missing file → empty log (first
 * Check-in); a file that is not a Goal Log fails loudly, never silently
 * dropped. The log is re-parsed on every append so concurrent edits survive.
 */
function loadGoalLog(): GoalLog {
  if (!existsSync(GOAL_LOG_PATH)) return { priorActionSteps: [] };
  const markdown = readFileSync(GOAL_LOG_PATH, 'utf8');
  return parseGoalLog(markdown);
}

/** Appends the closed Check-in's outcome to the local Goal Log file. */
function appendToGoalLog(state: ReturnType<Coach['state']>): void {
  const markdown = existsSync(GOAL_LOG_PATH)
    ? readFileSync(GOAL_LOG_PATH, 'utf8')
    : EMPTY_GOAL_LOG_MARKDOWN;
  // Local time, not UTC: the Check-in's date is the client's calendar date.
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  const date =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const next = appendCheckin(markdown, recordFromState(state, date));
  writeFileSync(GOAL_LOG_PATH, next, 'utf8');
  console.log(`--- Appended to ${GOAL_LOG_PATH} (gitignored) ---`);
}

function printReply(reply: CoachReply): void {
  console.log(`\nCOACH: ${reply.message}`);
  console.log(
    `       [phase: ${reply.phase}${reply.actionStep ? ` | action step: ${reply.actionStep.action} @ ${reply.actionStep.when}` : ''}]\n`,
  );
}

/** Real Brain if the key is present; faked fallback otherwise. */
function pickBrain(goalLog: GoalLog): { brain: LlmBrain; label: string } {
  let apiKey: string;
  try {
    apiKey = readApiKeyFromEnv();
  } catch (err: unknown) {
    // Only an actually-missing key downgrades to the faked Brain (announced
    // below). Any other failure is real and propagates — never swallowed.
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('OPENROUTER_API_KEY')) throw err;
    console.warn(
      'NOTE: OPENROUTER_API_KEY not set — using the faked LLM (canned responses, no network).\n' +
        '      Put the key in a gitignored .env (see .env.example) and re-run for the real coach.\n',
    );
    return { brain: fakeBrain, label: 'faked LLM (no API key)' };
  }
  // Built once; the Brain re-reads FUTURE_SELF_COACH_MODEL per call itself.
  const brain = createRealBrain({ apiKey, goalLog });
  return { brain, label: `real LLM: ${readModelFromEnv()} via OpenRouter` };
}

async function main(): Promise<void> {
  const goalLog = loadGoalLog();
  const { brain, label } = pickBrain(goalLog);
  const coach = createCoach({ brain, goalLog });

  console.log(`=== Future Self Coach — Check-in (${label}) ===\n`);
  printReply(await coach.open());

  const rl = createInterface({ input: stdin });
  const lines: string[] = [];
  let wake: (() => void) | undefined;
  let eof = false;

  rl.on('line', (line) => {
    lines.push(line);
    wake?.();
  });
  rl.on('close', () => {
    eof = true;
    wake?.();
  });

  // Wait for the next line or EOF.
  const nextLine = async (): Promise<string | undefined> => {
    while (true) {
      const line = lines.shift();
      if (line !== undefined) return line;
      if (eof) return undefined;
      await new Promise<void>((resolve) => (wake = resolve));
    }
  };

  try {
    while (true) {
      const line = await nextLine();
      if (line === undefined) {
        console.log('\n(input ended before the Check-in closed)');
        break;
      }
      const answer = line.trim();
      if (answer === '') continue;

      const reply = await coach.answer(answer);
      printReply(reply);

      if (reply.closed) {
        const state = coach.state();
        appendToGoalLog(state);
        console.log('--- Check-in transcript (Goal Log append shape) ---');
        for (const turn of state.turns) {
          console.log(
            `${turn.role === 'coach' ? 'COACH' : 'YOU  '} [${turn.phase}]: ${turn.text}`,
          );
        }
        break;
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((err: unknown) => {
  console.error(
    'checkin failed:',
    err instanceof Error ? err.message : String(err),
  );
  process.exitCode = 1;
});
