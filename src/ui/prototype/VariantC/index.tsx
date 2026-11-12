/** PROTOTYPE (throwaway). Variant C: transcript with a persistent side rail. */
import '@fontsource-variable/fraunces';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { FlowPhase } from '../../../core/types.js';
import type { ChatLine } from '../../components/Transcript.js';
import { PHASE_LABEL } from '../../phase-labels.js';
import type { VariantProps } from '../types.js';
import styles from './VariantC.module.css';

const STEP_PHASES: FlowPhase[] = ['TOWARD', 'AWAY', 'ACTION'];
const LEAD_IN_LABEL: Partial<Record<FlowPhase, string>> = {
  RECALL: 'Recalling your last Action Step…',
  FRAMING: 'Framing the Check-in…',
};

type StepState = 'done' | 'active' | 'pending';

function activeIndexFor(phase: FlowPhase | undefined): number {
  if (phase === undefined) return -1;
  if (phase === 'CLOSED') return STEP_PHASES.length;
  return STEP_PHASES.indexOf(phase === 'ENROLL' ? 'ACTION' : phase);
}

function excerptFor(lines: ChatLine[], step: FlowPhase): string | undefined {
  const mine = lines.filter((l) => l.role === 'user' && (l.phase === 'ENROLL' ? 'ACTION' : l.phase) === step);
  return mine.length > 0 ? mine[mine.length - 1]?.text : undefined;
}

function Icon({ d }: { d: string }): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const PLAY = 'M8 5v14l11-7z';
const SPEAKER = 'M4 9v6h4l5 4V5L8 9H4zM17 9a4 4 0 0 1 0 6';
const SPEAKER_OFF = 'M4 9v6h4l5 4V5L8 9H4zM17 9l4 6M21 9l-4 6';

function Rail({ p, mode }: { p: VariantProps; mode: 'gate' | 'checkin' | 'summary' }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const active = activeIndexFor(p.phase);
  const leadIn = p.phase != null ? LEAD_IN_LABEL[p.phase] : undefined;
  const { health } = p;
  return (
    <aside className={styles.rail} data-open={open || undefined}>
      <div className={styles.railTop}>
        <p className={styles.brand}>Future Self Coach</p>
        <button type="button" className={styles.moreBtn} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'Close' : 'Settings'}
        </button>
      </div>
      <div className={styles.railBody}>
        {leadIn != null && <p className={styles.leadIn}>{leadIn}</p>}
        <ol className={styles.steps} aria-label="Check-in steps">
          {STEP_PHASES.map((step, i) => {
            const state: StepState = i < active ? 'done' : i === active ? 'active' : 'pending';
            const excerpt = state === 'pending' ? undefined : excerptFor(p.lines, step);
            return (
              <li key={step} className={styles.step} data-state={state} aria-current={state === 'active' ? 'step' : undefined}>
                <span className={styles.marker} aria-hidden="true">
                  {state === 'done' && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.5l2.3 2.3 4.7-5" />
                    </svg>
                  )}
                </span>
                <span className={styles.stepLabel}>{PHASE_LABEL[step]}</span>
                {excerpt != null && <span className={styles.excerpt}>{excerpt}</span>}
              </li>
            );
          })}
        </ol>
      </div>
      <div className={styles.railFoot}>
        <dl className={styles.status}>
          <div className={styles.statusRow}>
            <dt>Brain</dt>
            <dd data-ok={health?.brain === 'real' || undefined}>
              {health == null ? 'connecting…' : health.brain === 'real' ? (health.model ?? 'live') : 'faked (no API key)'}
            </dd>
          </div>
          <div className={styles.statusRow}>
            <dt>Voice</dt>
            <dd data-ok={health?.voice === 'on' || undefined}>{health?.voice === 'on' ? 'on' : 'off (no ElevenLabs config)'}</dd>
          </div>
        </dl>
        <div className={styles.footActions}>
          <button type="button" className={styles.link} onClick={p.onToggleTheme}>
            {p.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          </button>
          {mode !== 'gate' && (
            <button type="button" className={styles.link} onClick={p.onRestart} disabled={p.busy}>
              Start new Check-in
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function Gate({ p }: { p: VariantProps }): React.JSX.Element {
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Future Self Coach</h1>
        <p className={styles.lede}>A check-in with the version of you a few years out.</p>
        <button type="button" className={styles.primary} onClick={p.onBegin} disabled={p.busy}>
          {p.busy ? 'Connecting…' : 'Begin Check-in'}
        </button>
        {p.error != null && (
          <p className={styles.error} role="alert">
            {p.error}
          </p>
        )}
      </div>
    </main>
  );
}

function Summary({ p }: { p: VariantProps }): React.JSX.Element {
  const { actionStep, logStatus, error } = p;
  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.eyebrow}>Check-in complete</h1>
        {actionStep != null ? (
          <section className={styles.actionBlock}>
            <p className={styles.label}>Your Action Step</p>
            <p className={styles.actionText}>{actionStep.action}</p>
            <p className={styles.when}>{actionStep.when}</p>
          </section>
        ) : (
          <p className={styles.note}>No Action Step was captured this time.</p>
        )}
        {logStatus === 'done' && <p className={styles.logLine}>Logged to your Goal Log.</p>}
        {logStatus === 'pending' && <p className={styles.logLine}>Logging to your Goal Log…</p>}
        {logStatus === 'error' && (
          <p className={styles.error} role="alert">
            Couldn't save to your Goal Log{error != null ? `: ${error}` : '.'}
          </p>
        )}
        <button type="button" className={styles.primary} onClick={p.onRestart}>
          Start new Check-in
        </button>
      </div>
    </main>
  );
}

function CheckIn({ p }: { p: VariantProps }): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [p.lines, p.busy]);

  let lastPhase: FlowPhase | undefined;
  return (
    <main className={styles.mainChat}>
      <div className={styles.scroll} ref={scrollRef}>
        <div className={styles.column}>
          {p.lines.map((l) => {
            const showDivider = l.phase != null && l.phase !== lastPhase;
            if (l.phase != null) lastPhase = l.phase;
            return (
              <div key={l.id}>
                {showDivider && l.phase != null && (
                  <div className={styles.divider}>
                    <span>{PHASE_LABEL[l.phase]}</span>
                  </div>
                )}
                {l.role === 'user' ? (
                  <p className={styles.user}>{l.text}</p>
                ) : (
                  <div className={styles.coach} data-speaking={l.id === p.speakingId || undefined}>
                    <p className={styles.coachText}>{l.text}</p>
                    {(l.audioUrl != null || l.id === p.speakingId) && (
                      <div className={styles.coachMeta}>
                        {l.audioUrl != null && (
                          <button type="button" className={styles.iconBtn} aria-label="Replay this line" onClick={() => p.onReplay(l)}>
                            <Icon d={PLAY} />
                          </button>
                        )}
                        {l.id === p.speakingId && (
                          <span className={styles.speaking} role="status">
                            <span className={styles.pulse} aria-hidden="true" />
                            Speaking
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {p.busy && (
            <div className={styles.typing} role="status" aria-label="The coach is typing">
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          )}
        </div>
      </div>
      <div className={styles.dock}>
        <div className={styles.column}>
          {p.error != null && (
            <p className={styles.error} role="alert">
              {p.error}
            </p>
          )}
          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault();
              p.onSend();
            }}
          >
            {p.voiceOn && (
              <button
                type="button"
                className={styles.iconBtn}
                aria-pressed={p.muted}
                aria-label={p.muted ? 'Unmute the coach' : 'Mute the coach'}
                onClick={p.onToggleMute}
              >
                <Icon d={p.muted ? SPEAKER_OFF : SPEAKER} />
              </button>
            )}
            <input
              className={styles.input}
              value={p.draft}
              onChange={(e) => p.onDraftChange(e.target.value)}
              placeholder="Type your answer…"
              aria-label="Message to the coach"
              disabled={p.busy}
            />
            <button type="submit" className={styles.send} disabled={p.busy || p.draft.trim() === ''}>
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function VariantC(props: VariantProps): React.JSX.Element {
  const mode = props.phase === undefined ? 'gate' : props.phase === 'CLOSED' ? 'summary' : 'checkin';
  return (
    <div className={styles.root} data-mode={mode}>
      <Rail p={props} mode={mode} />
      {mode === 'gate' && <Gate p={props} />}
      {mode === 'summary' && <Summary p={props} />}
      {mode === 'checkin' && <CheckIn p={props} />}
    </div>
  );
}
