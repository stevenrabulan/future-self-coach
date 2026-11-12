/**
 * PROTOTYPE (throwaway). Three variants of the whole app, switchable via
 * `?variant=A|B|C` on the existing route; `?frame=gate|checkin|summary`
 * swaps live state for fixtures so each frame can be reviewed without
 * running a Check-in. App.tsx keeps all state; a variant only renders.
 */
import type { ActionStep, FlowPhase } from '../../core/types.js';
import type { ChatLine } from '../components/Transcript.js';
import type { Health } from '../relay-client.js';
import type { Theme } from '../theme.js';

export interface VariantProps {
  /** undefined = start gate; 'CLOSED' = summary; anything else = Check-in. */
  phase: FlowPhase | undefined;
  lines: ChatLine[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onBegin: () => void;
  /** A request is in flight (connecting on the gate, coach typing in the Check-in). */
  busy: boolean;
  error?: string;
  health?: Health;
  voiceOn: boolean;
  muted: boolean;
  onToggleMute: () => void;
  /** id of the ChatLine whose audio is playing, or null. */
  speakingId: number | null;
  onReplay: (line: ChatLine) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onRestart: () => void;
  actionStep?: ActionStep;
  logStatus: 'pending' | 'done' | 'error';
}

export type VariantKey = 'current' | 'A' | 'B' | 'C';
export type FrameKey = 'live' | 'gate' | 'checkin' | 'summary';
