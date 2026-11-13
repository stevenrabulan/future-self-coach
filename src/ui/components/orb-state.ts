/** The three looks of the Coach Orb. */
export type OrbState = 'idle' | 'speaking' | 'thinking';

/**
 * Derives the Coach Orb's state from state App already owns. Thinking wins
 * over speaking. `speakingId` is a transcript line id (0 is valid), so the
 * check is against null, not truthiness.
 */
export function orbStateFor(busy: boolean, speakingId: number | null): OrbState {
  if (busy) return 'thinking';
  return speakingId != null ? 'speaking' : 'idle';
}
