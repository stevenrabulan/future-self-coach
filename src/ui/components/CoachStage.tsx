/**
 * The left column of the Check-in (ticket 03, ADR 0005): the step spine and
 * status menu on top, then the Coach Orb, the coach's latest line as a
 * caption, and the voice controls (mute, replay). Presentational: App owns
 * the state. The orb is decoration; the caption is what assistive tech
 * hears (polite live region).
 */
import type React from 'react';
import CoachOrb from './CoachOrb.js';
import styles from './CoachStage.module.css';
import { PlayIcon, SpeakerOff, SpeakerOn } from './icons.js';
import type { OrbState } from './orb-state.js';
import type { ChatLine } from './Transcript.js';

export interface CoachStageProps {
  orbState: OrbState;
  /** The newest coach line, or undefined before the first reply. */
  latest?: ChatLine;
  /** True while `latest` is the line being spoken. */
  speaking: boolean;
  voiceOn: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onReplay: (line: ChatLine) => void;
  /** Top centre: the phase stepper. */
  stepper: React.ReactNode;
  /** Top right: the status menu. */
  menu: React.ReactNode;
}

export default function CoachStage({
  orbState,
  latest,
  speaking,
  voiceOn,
  muted,
  onToggleMute,
  onReplay,
  stepper,
  menu,
}: CoachStageProps): React.JSX.Element {
  const canReplay = latest?.audioUrl != null;
  return (
    <section className={styles.stage} aria-label="Coach">
      <header className={styles.top}>
        <div className={styles.stepper}>{stepper}</div>
        <div className={styles.menu}>{menu}</div>
      </header>
      <div className={styles.body}>
        <CoachOrb state={orbState} size="stage" />
        {latest != null && (
          <p key={latest.id} className={styles.caption} data-speaking={speaking || undefined} aria-live="polite">
            {latest.text}
          </p>
        )}
        {(voiceOn || canReplay) && (
          <div className={styles.controls} role="group" aria-label="Voice controls">
            {voiceOn && (
              <button
                type="button"
                className={styles.ctrl}
                aria-pressed={muted}
                aria-label={muted ? 'Unmute the coach' : 'Mute the coach'}
                onClick={onToggleMute}
              >
                {muted ? <SpeakerOff /> : <SpeakerOn />}
              </button>
            )}
            {canReplay && latest != null && (
              <button type="button" className={styles.ctrl} aria-label="Replay this reply" onClick={() => onReplay(latest)}>
                <PlayIcon />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
