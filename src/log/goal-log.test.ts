import { describe, expect, it } from 'vitest';
import { appendCheckin, parseGoalLog } from './goal-log.js';
import type { CheckinRecord } from './goal-log.js';
import type { ActionStep } from '../core/types.js';

/**
 * The committed sample-goals.md shape: the format under test. The Goal Log
 * file is markdown with a Notes block and one Check-in block per Check-in.
 */
const SAMPLE = `# Goal Log

## Notes

- Demo goal: prove the coaching flow end-to-end.

## Check-ins

### Check-in — 2026-09-03 09:00

- Wanted most: ship the future-self-coach demo.
- Consequence: the idea stays a demo forever.
- Action Step: Write the spec
- Agreed date/time: 2026-09-04 09:00
`;

describe('Goal Log file format: parse', () => {
  it('parses prior Action Steps oldest first from the Check-in blocks', () => {
    const log = parseGoalLog(SAMPLE);
    expect(log.priorActionSteps).toEqual<ActionStep[]>([
      { action: 'Write the spec', when: '2026-09-04 09:00' },
    ]);
  });

  it('parses the Notes block into goalLog.notes', () => {
    const log = parseGoalLog(SAMPLE);
    expect(log.notes).toContain('prove the coaching flow end-to-end.');
  });

  it('parses multiple Check-ins with prior steps in file order (oldest first)', () => {
    const two = `${SAMPLE}
### Check-in — 2026-09-05 10:00

- Wanted most: record the demo video.
- Consequence: no proof it works.
- Action Step: Record the screen demo
- Agreed date/time: 2026-09-06 15:00
`;
    const log = parseGoalLog(two);
    expect(log.priorActionSteps).toEqual([
      { action: 'Write the spec', when: '2026-09-04 09:00' },
      { action: 'Record the screen demo', when: '2026-09-06 15:00' },
    ]);
  });

  it('parses an empty/placeholder log to an empty Goal Log without throwing', () => {
    const empty = `# Goal Log

## Notes

(none yet)

## Check-ins

(none yet)
`;
    const log = parseGoalLog(empty);
    expect(log.priorActionSteps).toEqual([]);
  });

  it('fails loudly on a file without the Goal Log header', () => {
    expect(() => parseGoalLog('# Not a Goal Log\n')).toThrow(/Goal Log/);
  });
});

describe('Goal Log file format: append', () => {
  const record: CheckinRecord = {
    date: '2026-09-05 10:00',
    wantedMost: 'Ship the demo.',
    consequence: 'It stays an idea.',
    actionStep: { action: 'Write the opening.', when: '9am' },
  };

  it('appends a Check-in block that parses back to the same Action Step', () => {
    const next = appendCheckin(SAMPLE, record);
    const log = parseGoalLog(next);
    expect(log.priorActionSteps.at(-1)).toEqual(record.actionStep);
  });

  it('writes the block with the agreed date/time and outcome lines', () => {
    const next = appendCheckin(SAMPLE, record);
    expect(next).toContain('### Check-in — 2026-09-05 10:00');
    expect(next).toContain('- Action Step: Write the opening.');
    expect(next).toContain('- Agreed date/time: 9am');
  });

  it('is append-only: the previous content is untouched', () => {
    const next = appendCheckin(SAMPLE, record);
    expect(next.startsWith(SAMPLE)).toBe(true);
  });

  it('appends to an empty placeholder log too', () => {
    const empty = `# Goal Log\n\n## Notes\n\n(none yet)\n\n## Check-ins\n\n(none yet)\n`;
    const next = appendCheckin(empty, record);
    const log = parseGoalLog(next);
    expect(log.priorActionSteps).toEqual([record.actionStep]);
  });
});