/**
 * Terminal Check-in loop: runs a full Check-in against the faked LLM
 * (ticket 01). `npm run checkin` — no network, no voice, no UI.
 *
 * Reads stdin line-by-line, so it works both interactive (TTY) and piped
 * (scripted demo). On piped EOF mid-flow the coach finishes with the
 * questions it can still ask, and the run ends cleanly.
 */
import { createCoach } from '../core/coach.js';
import { fakeBrain } from '../brain/fake-brain.js';
import type { CoachReply, GoalLog } from '../core/types.js';
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

async function main(): Promise<void> {
  const coach = createCoach({ brain: fakeBrain, goalLog });

  console.log('=== Future Self Coach — Check-in (faked LLM, ticket 01) ===\n');
  printReply(coach.open());

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

      const reply = coach.answer(answer);
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
