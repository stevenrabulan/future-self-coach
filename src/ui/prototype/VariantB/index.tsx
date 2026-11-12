/** PROTOTYPE (throwaway). Variant B, "Voice stage": the coach as a presence (orb). */
import '@fontsource-variable/geist';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { FlowPhase } from '../../../core/types.js';
import type { ChatLine } from '../../components/Transcript.js';
import { PHASE_LABEL } from '../../phase-labels.js';
import type { VariantProps } from '../types.js';
import Orb, { type OrbState } from './Orb.js';
import styles from './VariantB.module.css';

const STEP_PHASES: FlowPhase[] = ['TOWARD', 'AWAY', 'ACTION'];
const LEAD_IN_LABEL: Partial<Record<FlowPhase, string>> = {
  RECALL: 'Recalling your last Action Step…',
  FRAMING: 'Framing the Check-in…',
};

function stepIndexForPhase(phase: FlowPhase): number {
  return STEP_PHASES.indexOf(phase === 'ENROLL' ? 'ACTION' : phase);
}

function Stepper({ phase }: { phase: FlowPhase }): React.JSX.Element {
  const leadIn = LEAD_IN_LABEL[phase];
  if (leadIn != null) return <p className={styles.leadIn}>{leadIn}</p>;
  const active = stepIndexForPhase(phase);
  return (
    <ol className={styles.stepper}>
      {STEP_PHASES.map((p, i) => (
        <li key={p} className={styles.step} data-state={i < active ? 'done' : i === active ? 'active' : 'pending'}>
          <span className={styles.stepDot} />
          <span>{PHASE_LABEL[p]}</span>
        </li>
      ))}
    </ol>
  );
}

function Icon({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const SpeakerOn = (): React.JSX.Element => (
  <Icon>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
);
const SpeakerOff = (): React.JSX.Element => (
  <Icon>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Icon>
);
const Replay = (): React.JSX.Element => (
  <Icon>
    <path d="M8 5.5v13l10.5-6.5L8 5.5z" />
  </Icon>
);
const Send = (): React.JSX.Element => (
  <Icon>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
);
const Menu = (): React.JSX.Element => (
  <Icon>
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  </Icon>
);

function StatusMenu({
  health,
  theme,
  onToggleTheme,
  onRestart,
  restartDisabled,
  showRestart,
}: Pick<VariantProps, 'health' | 'theme' | 'onToggleTheme' | 'onRestart'> & {
  restartDisabled?: boolean;
  showRestart: boolean;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={styles.menuWrap}>
      <button type="button" className={styles.iconBtn} aria-label="Status menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Menu />
      </button>
      {open && (
        <>
          <button type="button" className={styles.backdrop} aria-label="Close status menu" tabIndex={-1} onClick={() => setOpen(false)} />
          <div className={styles.popover} role="menu">
            <div className={styles.row}>
              <span className={styles.rowLabel}>Brain</span>
              <span className={styles.rowValue}>
                {health == null ? 'connecting…' : health.brain === 'real' ? (health.model ?? 'live') : 'faked (no API key)'}
              </span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Voice</span>
              <span className={styles.rowValue}>{health?.voice === 'on' ? 'on' : 'off (no ElevenLabs config)'}</span>
            </div>
            <button type="button" className={styles.menuItem} role="menuitem" onClick={onToggleTheme}>
              {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            </button>
            {showRestart && (
              <button
                type="button"
                className={styles.menuItem}
                role="menuitem"
                disabled={restartDisabled}
                onClick={() => {
                  setOpen(false);
                  onRestart();
                }}
              >
                Start new Check-in
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Transcript({
  lines,
  busy,
  speakingId,
  onReplay,
}: Pick<VariantProps, 'lines' | 'busy' | 'speakingId' | 'onReplay'>): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [lines, busy]);
  let lastPhase: FlowPhase | undefined;
  return (
    <div className={styles.transcript} ref={ref}>
      {lines.map((l) => {
        const divider = l.phase != null && l.phase !== lastPhase;
        if (l.phase != null) lastPhase = l.phase;
        return (
          <div key={l.id}>
            {divider && l.phase != null && <div className={styles.divider}>{PHASE_LABEL[l.phase]}</div>}
            {l.role === 'system' ? (
              <p className={styles.system}>{l.text}</p>
            ) : (
              <div className={l.role === 'user' ? styles.userRow : styles.coachRow}>
                <div className={l.role === 'user' ? styles.userBubble : styles.coachText} data-speaking={l.id === speakingId || undefined}>
                  <span className="srOnly">{l.role === 'user' ? 'You: ' : 'Coach: '}</span>
                  {l.text}
                </div>
                {l.role === 'coach' && l.audioUrl != null && (
                  <button type="button" className={styles.miniBtn} aria-label="Replay this reply" onClick={() => onReplay(l)}>
                    <Replay />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {busy && (
        <div className={styles.typing} role="status">
          <span className="srOnly">Coach is thinking</span>
          <span className={styles.tDot} />
          <span className={styles.tDot} />
          <span className={styles.tDot} />
        </div>
      )}
    </div>
  );
}

export default function VariantB(props: VariantProps): React.JSX.Element {
  const { phase, busy, error, speakingId } = props;
  const orbState: OrbState = busy ? 'thinking' : speakingId != null ? 'speaking' : 'idle';
  const menu = (showRestart: boolean, restartDisabled?: boolean): React.JSX.Element => (
    <StatusMenu
      health={props.health}
      theme={props.theme}
      onToggleTheme={props.onToggleTheme}
      onRestart={props.onRestart}
      showRestart={showRestart}
      restartDisabled={restartDisabled}
    />
  );

  if (phase === undefined) {
    return (
      <div className={styles.root} data-frame="gate">
        <div className={styles.ambient} />
        <div className={styles.corner}>{menu(false)}</div>
        <main className={styles.center}>
          <Orb state={busy ? 'thinking' : 'idle'} size="gate" />
          <h1 className={styles.title}>Future Self Coach</h1>
          <p className={styles.tagline}>A check-in with the version of you a few years out.</p>
          <button type="button" className={styles.primary} onClick={props.onBegin} disabled={busy}>
            {busy ? 'Connecting…' : 'Begin Check-in'}
          </button>
          {error != null && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </main>
      </div>
    );
  }

  if (phase === 'CLOSED') {
    const { actionStep, logStatus } = props;
    return (
      <div className={styles.root} data-frame="summary">
        <div className={styles.ambient} />
        <div className={styles.corner}>{menu(true)}</div>
        <main className={styles.center}>
          <Orb state="idle" size="mark" />
          <p className={styles.eyebrow}>Check-in complete</p>
          {actionStep != null ? (
            <section className={styles.hero} aria-labelledby="b-action-label">
              <p id="b-action-label" className={styles.heroLabel}>
                Your Action Step
              </p>
              <p className={styles.heroAction}>{actionStep.action}</p>
              <p className={styles.heroWhen}>{actionStep.when}</p>
            </section>
          ) : (
            <p className={styles.heroNote}>No Action Step was captured this time.</p>
          )}
          {logStatus === 'done' && <p className={styles.logLine}>Logged to your Goal Log.</p>}
          {logStatus === 'pending' && <p className={styles.logLine}>Logging to your Goal Log…</p>}
          {logStatus === 'error' && (
            <p className={styles.error} role="alert">
              Couldn't save to your Goal Log{error != null ? `: ${error}` : '.'}
            </p>
          )}
          <button type="button" className={styles.secondary} onClick={props.onRestart}>
            Start new Check-in
          </button>
        </main>
      </div>
    );
  }

  const latest: ChatLine | undefined = [...props.lines].reverse().find((l) => l.role === 'coach');
  const hasControls = props.voiceOn || latest?.audioUrl != null;

  return (
    <div className={styles.root} data-frame="checkin">
      <div className={styles.ambient} />
      <div className={styles.checkin}>
        <section className={styles.stage} aria-label="Coach">
          <header className={styles.stageTop}>
            <span className={styles.topSpacer} />
            <Stepper phase={phase} />
            <div className={styles.topEnd}>{menu(true, busy)}</div>
          </header>
          <div className={styles.stageBody}>
            <Orb state={orbState} size="stage" />
            {latest != null && (
              <p key={latest.id} className={styles.caption} data-speaking={latest.id === speakingId || undefined} aria-live="polite">
                {latest.text}
              </p>
            )}
            {hasControls && (
              <div className={styles.controls} role="group" aria-label="Voice controls">
                {props.voiceOn && (
                  <button
                    type="button"
                    className={styles.ctrl}
                    aria-pressed={props.muted}
                    aria-label={props.muted ? 'Unmute the coach' : 'Mute the coach'}
                    onClick={props.onToggleMute}
                  >
                    {props.muted ? <SpeakerOff /> : <SpeakerOn />}
                  </button>
                )}
                {latest?.audioUrl != null && (
                  <button type="button" className={styles.ctrl} aria-label="Replay this reply" onClick={() => props.onReplay(latest)}>
                    <Replay />
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
        <aside className={styles.panel} aria-label="Conversation">
          <Transcript lines={props.lines} busy={busy} speakingId={speakingId} onReplay={props.onReplay} />
          {error != null && (
            <p className={styles.panelError} role="alert">
              {error}
            </p>
          )}
          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault();
              props.onSend();
            }}
          >
            <input
              className={styles.input}
              value={props.draft}
              onChange={(e) => props.onDraftChange(e.target.value)}
              placeholder="Type your reply"
              disabled={busy}
              aria-label="Message to the coach"
            />
            <button type="submit" className={styles.send} aria-label="Send" disabled={busy || props.draft.trim() === ''}>
              <Send />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
