/**
 * Ticket 03: pure helpers behind the stage caption and the grouped
 * transcript. Observable behaviour only: which line is the caption, and
 * which lines sit under which Check-in Phase heading.
 */
import { describe, expect, it } from 'vitest';
import { groupByPhase, latestCoachLine } from './transcript-lines.js';
import type { ChatLine } from './Transcript.js';

const line = (id: number, role: ChatLine['role'], phase?: ChatLine['phase']): ChatLine => ({
  id,
  role,
  text: `t${id}`,
  phase,
});

describe('latestCoachLine', () => {
  it('is undefined with no lines or no coach line', () => {
    expect(latestCoachLine([])).toBeUndefined();
    expect(latestCoachLine([line(0, 'user')])).toBeUndefined();
  });

  it('returns the newest coach line, skipping later user lines', () => {
    const lines = [line(0, 'coach'), line(1, 'user'), line(2, 'coach'), line(3, 'user')];
    expect(latestCoachLine(lines)?.id).toBe(2);
  });
});

describe('groupByPhase', () => {
  it('is empty for no lines', () => {
    expect(groupByPhase([])).toEqual([]);
  });

  it('starts a new group each time the phase changes', () => {
    const groups = groupByPhase([
      line(0, 'coach', 'RECALL'),
      line(1, 'user', 'RECALL'),
      line(2, 'coach', 'TOWARD'),
      line(3, 'user', 'TOWARD'),
      line(4, 'coach', 'AWAY'),
    ]);
    expect(groups.map((g) => [g.phase, g.lines.map((l) => l.id)])).toEqual([
      ['RECALL', [0, 1]],
      ['TOWARD', [2, 3]],
      ['AWAY', [4]],
    ]);
  });

  it('keeps a line without a phase in the current group', () => {
    const groups = groupByPhase([line(0, 'coach', 'TOWARD'), line(1, 'system'), line(2, 'user', 'TOWARD')]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.lines.map((l) => l.id)).toEqual([0, 1, 2]);
  });

  it('opens a group with no phase when the first lines have none', () => {
    const groups = groupByPhase([line(0, 'system'), line(1, 'coach', 'TOWARD')]);
    expect(groups.map((g) => g.phase)).toEqual([undefined, 'TOWARD']);
  });
});
