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
import { fakeBrain } from '../brain/fake-brain.js';
import { createRealBrain, readApiKeyFromEnv, readModelFromEnv } from '../brain/real-brain.js';
import type { CoachReply, GoalLog, LlmBrain } from '../core/types.js';
import { createInterface } from 'node:readline';
import { stdin } from 'node:process';

const goalLog: GoalLog = {
  priorActionSteps: [
    // Sample history so the recall path shows in the terminal demo.
    { action: 'Write the future-self-coach spec', when: '2026-09-03 09:00' },
  ],
  notes: 'Demo goal: prove the coaching flow end-to-end.',
};

function printReply(reply: CoachReply): void {
  console.log(`\nCOACH: ${reply.message}`);
  console.log(
    `       [phase: ${reply.phase}${reply.actionStep ? ` | action step: ${reply.actionStep.action} @ ${reply.actionStep.when}` : ''}]\n`,
  );
}

/** Real Brain if the key is present; faked fallback otherwise. */
function pickBrain(): { brain: LlmBrain; label: string } {
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
  const { brain, label } = pickBrain();
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
