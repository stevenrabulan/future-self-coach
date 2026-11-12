/** PROTOTYPE (throwaway). Variant A: one question at a time. */
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { FlowPhase } from '../../../core/types.js';
import type { ChatLine } from '../../components/Transcript.js';
import { PHASE_LABEL } from '../../phase-labels.js';
import type { VariantProps } from '../types.js';
import styles from './VariantA.module.css';

const STEP_PHASES: FlowPhase[] = ['TOWARD', 'AWAY', 'ACTION'];
const LEAD_IN_LABEL: Partial<Record<FlowPhase, string>> = {
  RECALL: 'Recalling your last Action Step…',
  FRAMING: 'Framing the Check-in…',
};

function stepIndexForPhase(phase: FlowPhase): number {
  return STEP_PHASES.indexOf(phase === 'ENROLL' ? 'ACTION' : phase);
}

function Icon({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const MenuIcon = (): React.JSX.Element => (
  <Icon>
    <path d="M4 8h16M4 16h16" />
  </Icon>
);
const ReplayIcon = (): React.JSX.Element => (
  <Icon>
    <path d="M8 5.5v13l10-6.5z" />
  </Icon>
);
const SoundIcon = (): React.JSX.Element => (
  <Icon>
    <path d="M4 10v4h4l5 4V6L8 10z" />
    <path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
);
const MutedIcon = (): React.JSX.Element => (
  <Icon>
    <path d="M4 10v4h4l5 4V6L8 10z" />
    <path d="M17 9.5l4 5M21 9.5l-4 5" />
  </Icon>
);

function Stepper({ phase }: { phase: FlowPhase }): React.JSX.Element {
  const leadIn = LEAD_IN_LABEL[phase];
  const active = leadIn != null ? -1 : stepIndexForPhase(phase);
  return (
    <div className={styles.progress}>
      <ol className={styles.steps}>
        {STEP_PHASES.map((p, i) => (
          <li key={p} className={styles.step} data-state={i < active ? 'done' : i === active ? 'active' : 'pending'} aria-current={i === active ? 'step' : undefined}>
            <span className={styles.seg} />
            <span className={styles.stepLabel}>{PHASE_LABEL[p]}</span>
          </li>
        ))}
      </ol>
      {leadIn != null && <p className={styles.leadIn}>{leadIn}</p>}
    </div>
  );
}

function Menu({ p, showRestart }: { p: VariantProps; showRestart: boolean }): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const { health } = p;
  return (
    <div className={styles.menuWrap} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button type="button" className={styles.iconBtn} aria-label="Status menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <MenuIcon />
      </button>
      {open && (
        <>
          <button type="button" className={styles.backdrop} aria-label="Close status menu" tabIndex={-1} onClick={() => setOpen(false)} />
          <div className={styles.popover} role="menu">
            <div className={styles.row}>
              <span className={styles.rowLabel}>Brain</span>
              <span className={styles.rowValue}>{health == null ? 'connecting…' : health.brain === 'real' ? (health.model ?? 'live') : 'faked (no API key)'}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Voice</span>
              <span className={styles.rowValue}>{health?.voice === 'on' ? 'on' : 'off (no ElevenLabs config)'}</span>
            </div>
            <button type="button" className={styles.item} role="menuitem" onClick={p.onToggleTheme}>
              {p.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            </button>
            {showRestart && (
              <button
                type="button"
                className={styles.item}
                role="menuitem"
                disabled={p.busy}
                onClick={() => {
                  setOpen(false);
                  p.onRestart();
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

function Earlier({ lines, onReplay }: { lines: ChatLine[]; onReplay: (l: ChatLine) => void }): React.JSX.Element | null {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  const visible = lines.filter((l) => l.role !== 'system');
  if (visible.length === 0) return null;
  return (
    <>
      <button type="button" className={styles.textBtn} aria-expanded={open} onClick={() => setOpen(true)}>
        Earlier in this Check-in
      </button>
      {open && (
        <div className={styles.drawerWrap} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
          <button type="button" className={styles.backdrop} aria-label="Close earlier conversation" tabIndex={-1} onClick={() => setOpen(false)} />
          <aside className={styles.drawer} role="dialog" aria-label="Earlier in this Check-in">
            <div className={styles.drawerHead}>
              <h2 className={styles.drawerTitle}>Earlier in this Check-in</h2>
              <button ref={closeRef} type="button" className={styles.textBtn} onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <ol className={styles.history}>
              {visible.map((l) => (
                <li key={l.id} className={styles.histItem}>
                  <span className={styles.histWho}>{l.role === 'user' ? 'You' : 'Coach'}</span>
                  <span className={styles.histText}>{l.text}</span>
                  {l.role === 'coach' && l.audioUrl != null && (
                    <button type="button" className={styles.textBtn} onClick={() => onReplay(l)}>
                      Replay
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
    </>
  );
}

function CheckIn(p: VariantProps): React.JSX.Element {
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = taRef.current;
    if (el == null) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [p.draft]);

  let hero: ChatLine | undefined;
  let lastUser: ChatLine | undefined;
  for (let i = p.lines.length - 1; i >= 0; i--) {
    const l = p.lines[i];
    if (l == null) continue;
    if (hero == null && l.role === 'coach') hero = l;
    if (lastUser == null && l.role === 'user') lastUser = l;
    if (hero != null && lastUser != null) break;
  }
  // Context line: the user's answer closest to the question on screen. While
  // the coach is thinking, that is their just-sent answer.
  const heroIdx = hero == null ? -1 : p.lines.indexOf(hero);
  const lastUserIdx = lastUser == null ? -1 : p.lines.indexOf(lastUser);
  let context: ChatLine | undefined;
  if (p.busy) context = lastUserIdx > heroIdx ? lastUser : undefined;
  else context = p.lines.slice(0, heroIdx).reverse().find((l) => l.role === 'user');

  const phase = p.phase as FlowPhase;
  const speaking = hero != null && hero.id === p.speakingId;
  const canSend = !p.busy && p.draft.trim() !== '';

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Stepper phase={phase} />
        <Menu p={p} showRestart />
      </header>
      <main className={styles.main}>
        <div className={styles.stage}>
          <p className={styles.context} data-empty={context == null || undefined}>
            {context != null && (
              <>
                <span className={styles.contextLabel}>You said: </span>
                {context.text}
              </>
            )}
          </p>
          {p.busy || hero == null ? (
            <div className={styles.thinking} role="status">
              <span className="srOnly">The coach is thinking</span>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          ) : (
            <>
              <h1 key={hero.id} className={styles.hero} aria-live="polite">
                <span className="srOnly">Coach: </span>
                {hero.text}
              </h1>
              <div className={styles.tools}>
                <span className={styles.speaking} data-on={speaking || undefined} role="status">
                  {speaking && <span className="srOnly">The coach is speaking</span>}
                  <span className={styles.bar} />
                  <span className={styles.bar} />
                  <span className={styles.bar} />
                </span>
                {hero.audioUrl != null && (
                  <button type="button" className={styles.iconBtn} aria-label="Replay this reply" onClick={() => hero != null && p.onReplay(hero)}>
                    <ReplayIcon />
                  </button>
                )}
                {p.voiceOn && (
                  <button type="button" className={styles.iconBtn} aria-pressed={p.muted} aria-label={p.muted ? 'Unmute the coach' : 'Mute the coach'} onClick={p.onToggleMute}>
                    {p.muted ? <MutedIcon /> : <SoundIcon />}
                  </button>
                )}
              </div>
            </>
          )}
          <form
            className={styles.answer}
            onSubmit={(e) => {
              e.preventDefault();
              if (canSend) p.onSend();
            }}
          >
            <textarea
              ref={taRef}
              rows={1}
              className={styles.input}
              value={p.draft}
              disabled={p.busy}
              placeholder="Your answer"
              aria-label="Message to the coach"
              onChange={(e) => p.onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (canSend) p.onSend();
                }
              }}
            />
            <button type="submit" className={styles.primary} disabled={!canSend}>
              Send
            </button>
          </form>
          {p.error != null && (
            <p className={styles.error} role="alert">
              {p.error}
            </p>
          )}
        </div>
      </main>
      <footer className={styles.footer}>
        <Earlier lines={p.lines} onReplay={p.onReplay} />
      </footer>
    </div>
  );
}

function Gate(p: VariantProps): React.JSX.Element {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <span className={styles.progress} />
        <Menu p={p} showRestart={false} />
      </header>
      <main className={styles.main}>
        <div className={styles.stage}>
          <h1 className={styles.hero}>Future Self Coach</h1>
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
      <footer className={styles.footer} />
    </div>
  );
}

function Summary(p: VariantProps): React.JSX.Element {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <span className={styles.progress} />
        <Menu p={p} showRestart />
      </header>
      <main className={styles.main}>
        <div className={styles.stage}>
          <p className={styles.eyebrow}>Check-in complete</p>
          {p.actionStep != null ? (
            <>
              <p className={styles.eyebrow}>Your Action Step</p>
              <h1 className={styles.hero}>{p.actionStep.action}</h1>
              <p className={styles.lede}>{p.actionStep.when}</p>
            </>
          ) : (
            <p className={styles.lede}>No Action Step was captured this time.</p>
          )}
          {p.logStatus === 'done' && <p className={styles.log}>Logged to your Goal Log.</p>}
          {p.logStatus === 'pending' && <p className={styles.log}>Logging to your Goal Log…</p>}
          {p.logStatus === 'error' && (
            <p className={styles.error} role="alert">
              Couldn't save to your Goal Log{p.error != null ? `: ${p.error}` : '.'}
            </p>
          )}
          <button type="button" className={styles.primary} onClick={p.onRestart}>
            Start new Check-in
          </button>
        </div>
      </main>
      <footer className={styles.footer} />
    </div>
  );
}

export default function VariantA(props: VariantProps): React.JSX.Element {
  if (props.phase === undefined) return <Gate {...props} />;
  if (props.phase === 'CLOSED') return <Summary {...props} />;
  return <CheckIn {...props} />;
}
