/** PROTOTYPE (throwaway). Canned state for `?frame=` so every frame is reviewable at once. */
import type { ChatLine } from '../components/Transcript.js';
import type { FrameKey, VariantProps } from './types.js';

const LINES: ChatLine[] = [
  { id: 0, role: 'coach', phase: 'RECALL', text: 'Last time you committed to drafting the first two pages of the proposal by Friday 9am. How did that go?' },
  { id: 1, role: 'user', phase: 'RECALL', text: 'I got one page done. The second one stalled when work got busy.' },
  { id: 2, role: 'coach', phase: 'TOWARD', audioUrl: 'about:blank', text: 'One page is real progress. So, what do you want most right now?' },
  { id: 3, role: 'user', phase: 'TOWARD', text: 'To finish the proposal and actually send it. I keep polishing instead of shipping.' },
  { id: 4, role: 'coach', phase: 'TOWARD', audioUrl: 'about:blank', text: 'And what happens if you make it happen?' },
  { id: 5, role: 'user', phase: 'TOWARD', text: 'I stop carrying it around. And I find out if the idea has legs.' },
  { id: 6, role: 'coach', phase: 'AWAY', audioUrl: 'about:blank', text: "I remember that weight. Now the other side: what's the consequence if you don't achieve it?" },
];

type Fixture = Pick<VariantProps, 'phase' | 'lines' | 'busy' | 'error' | 'health' | 'voiceOn' | 'speakingId' | 'actionStep' | 'logStatus'>;

export function fixtureFor(frame: Exclude<FrameKey, 'live'>): Fixture {
  const base: Fixture = {
    phase: undefined,
    lines: [],
    busy: false,
    error: undefined,
    health: { ok: true, brain: 'real', model: 'glm-5.3-flash', voice: 'on' },
    voiceOn: true,
    speakingId: null,
    actionStep: undefined,
    logStatus: 'done',
  };
  if (frame === 'gate') return base;
  if (frame === 'checkin') return { ...base, phase: 'AWAY', lines: LINES, speakingId: 6 };
  return {
    ...base,
    phase: 'CLOSED',
    lines: LINES,
    actionStep: { action: 'Send the finished proposal to Dana, polished or not.', when: '2026-11-14 09:00' },
  };
}
