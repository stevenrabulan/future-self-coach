/**
 * Ticket 02: the Coach Orb's state is derived from state App already owns.
 * Thinking wins over speaking; the summary and the idle gate show idle.
 */
import { describe, expect, it } from 'vitest';
import { orbStateFor } from './orb-state.js';

describe('orbStateFor', () => {
  it('is thinking while a request is in flight', () => {
    expect(orbStateFor(true, null)).toBe('thinking');
  });

  it('is speaking when a coach line is being spoken', () => {
    expect(orbStateFor(false, 3)).toBe('speaking');
  });

  it('treats line id 0 as speaking (the first line has id 0)', () => {
    expect(orbStateFor(false, 0)).toBe('speaking');
  });

  it('thinking wins over speaking', () => {
    expect(orbStateFor(true, 3)).toBe('thinking');
  });

  it('is idle otherwise', () => {
    expect(orbStateFor(false, null)).toBe('idle');
  });
});
