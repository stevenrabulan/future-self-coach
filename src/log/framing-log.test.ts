/**
 * Ticket 07: the Goal Log's `## Framing` section — where the client's
 * acceptance of the Framing Questions survives between Check-ins.
 */
import { describe, expect, it } from 'vitest';
import { appendCheckin, EMPTY_GOAL_LOG_MARKDOWN, parseGoalLog, recordFromState } from './goal-log.js';
import type { CheckinRecord } from './goal-log.js';
import type { ConversationState } from '../core/types.js';

const record: CheckinRecord = {
  date: '2026-09-09 10:00',
  wantedMost: 'ship the demo',
  consequence: 'it stays a demo forever',
  actionStep: { action: 'Write the spec', when: '9am' },
};

describe('parsing the Framing section', () => {
  it('reads the acceptance date', () => {
    const markdown = [
      '# Goal Log',
      '',
      '## Framing',
      '',
      '- Accepted: 2026-09-01 09:00',
      '',
      '## Check-ins',
      '',
      '(none yet)',
      '',
    ].join('\n');
    expect(parseGoalLog(markdown).framingAcceptedOn).toBe('2026-09-01 09:00');
  });

  it('treats a log with no Framing section as not yet accepted (back-compat)', () => {
    expect(parseGoalLog(EMPTY_GOAL_LOG_MARKDOWN).framingAcceptedOn).toBeUndefined();
  });

  it('treats the placeholder as not yet accepted', () => {
    const markdown = '# Goal Log\n\n## Framing\n\n(none yet)\n\n## Check-ins\n\n(none yet)\n';
    expect(parseGoalLog(markdown).framingAcceptedOn).toBeUndefined();
  });

  it('does not mistake Framing content for a Check-in or a Note', () => {
    const markdown = '# Goal Log\n\n## Framing\n\n- Accepted: 2026-09-01 09:00\n\n## Notes\n\n- Ship it.\n';
    const log = parseGoalLog(markdown);
    expect(log.notes).toBe('Ship it.');
    expect(log.priorActionSteps).toEqual([]);
  });
});

describe('writing the acceptance on append', () => {
  it('adds a Framing section when the Check-in recorded an acceptance', () => {
    const next = appendCheckin(EMPTY_GOAL_LOG_MARKDOWN, {
      ...record,
      framingAccepted: true,
    });
    expect(parseGoalLog(next).framingAcceptedOn).toBe(record.date);
  });

  it('leaves the log without a Framing section when nothing was accepted', () => {
    const next = appendCheckin(EMPTY_GOAL_LOG_MARKDOWN, record);
    expect(parseGoalLog(next).framingAcceptedOn).toBeUndefined();
    expect(next).not.toContain('## Framing');
  });

  it('keeps the original acceptance date when one is already on record', () => {
    const first = appendCheckin(EMPTY_GOAL_LOG_MARKDOWN, {
      ...record,
      framingAccepted: true,
    });
    const second = appendCheckin(first, {
      ...record,
      date: '2026-09-10 11:00',
      framingAccepted: true,
    });
    expect(parseGoalLog(second).framingAcceptedOn).toBe(record.date);
  });

  it('still appends the Check-in itself alongside the acceptance', () => {
    const next = appendCheckin(EMPTY_GOAL_LOG_MARKDOWN, {
      ...record,
      framingAccepted: true,
    });
    expect(parseGoalLog(next).priorActionSteps).toEqual([record.actionStep]);
  });
});

describe('recordFromState carries the acceptance', () => {
  const baseState: ConversationState = {
    phase: 'CLOSED',
    actionStep: { action: 'Write the spec', when: '9am' },
    turns: [
      { role: 'user', text: 'ship the demo', phase: 'TOWARD' },
      { role: 'user', text: 'it stays a demo forever', phase: 'AWAY' },
    ],
  };

  it('sets framingAccepted when the Check-in captured one', () => {
    const result = recordFromState({ ...baseState, framingAccepted: true }, '2026-09-09 10:00');
    expect(result.framingAccepted).toBe(true);
  });

  it('omits it when the client never accepted', () => {
    expect(recordFromState(baseState, '2026-09-09 10:00').framingAccepted).toBeUndefined();
  });
});
