import { describe, expect, it } from 'vitest';
import { formatDisplayDate } from './display-date.js';

describe('formatDisplayDate', () => {
  it('formats a stored date and time', () => {
    expect(formatDisplayDate('2026-11-14 07:00')).toBe('Saturday, November 14th at 7:00 am');
  });
  it('uses pm, 12 for noon and midnight', () => {
    expect(formatDisplayDate('2026-09-05T15:30')).toBe('Saturday, September 5th at 3:30 pm');
    expect(formatDisplayDate('2026-09-05 12:00')).toBe('Saturday, September 5th at 12:00 pm');
    expect(formatDisplayDate('2026-09-05 00:15')).toBe('Saturday, September 5th at 12:15 am');
  });
  it('picks the right ordinal', () => {
    expect(formatDisplayDate('2026-11-01')).toBe('Sunday, November 1st');
    expect(formatDisplayDate('2026-11-02')).toBe('Monday, November 2nd');
    expect(formatDisplayDate('2026-11-03')).toBe('Tuesday, November 3rd');
    expect(formatDisplayDate('2026-11-12')).toBe('Thursday, November 12th');
    expect(formatDisplayDate('2026-11-23')).toBe('Monday, November 23rd');
  });
  it('returns anything it cannot read unchanged', () => {
    expect(formatDisplayDate('tomorrow morning')).toBe('tomorrow morning');
    expect(formatDisplayDate('2026-02-30 09:00')).toBe('2026-02-30 09:00');
    expect(formatDisplayDate('2026-11-14 25:00')).toBe('2026-11-14 25:00');
  });
});
