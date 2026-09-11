/**
 * One-screen chat UI (ticket 04; redesigned in ticket 08): the Future Self
 * Coach in the browser. Coach Core runs client-side against the relay's
 * Brain; the Goal Log is loaded at Check-in start and appended on close.
 * Keys stay server-side: the UI never touches OpenRouter directly.
 *
 * The screen is one of three frames: StartGate (before the Check-in
 * starts), the main shell (stepper + transcript + composer), or SummaryCard
 * (once the Check-in closes). Component split and state ownership per ADR
 * 0004: state stays here, children are presentational.
 */
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { createCoach } from '../core/coach.js';
import type { CoachReply, FlowPhase, GoalLog } from '../core/types.js';
import { recordFromState } from '../log/goal-log.js';
import styles from './App.module.css';
import Composer from './components/Composer.js';
import PhaseStepper from './components/PhaseStepper.js';
import StartGate from './components/StartGate.js';
import StatusMenu from './components/StatusMenu.js';
import SummaryCard from './components/SummaryCard.js';
import Transcript, { type ChatLine } from './components/Transcript.js';
import {
  fetchGoalLog,
  fetchHealth,
  postBrain,
  postGoalLogAppend,
  postSpeak,
  type Health,
} from './relay-client.js';
import { currentTheme, setStoredTheme, type Theme } from './theme.js';

/** Local timestamp in the Goal Log's "YYYY-MM-DD HH:mm" shape. */
function localTimestamp(): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}`
  );
}

/** Boundary check on the relay's JSON before it enters Coach Core. */
function isGoalLogShape(value: unknown): GoalLog {
  if (
    typeof value !== 'object' || value == null ||
    !Array.isArray((value as { priorActionSteps?: unknown }).priorActionSteps)
  ) {
    throw new Error(`relay: /api/goal-log returned a shape that is not a GoalLog: ${JSON.stringify(value).slice(0, 200)}`);
  }
  return value as GoalLog;
}

export default function App(): React.JSX.Element {
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [finalActionStep, setFinalActionStep] = useState<CoachReply['actionStep']>();
  /** The Goal Log append that follows a closed Check-in; drives SummaryCard's
   * confirmation text independently of navigation, which follows `phase`. */
  const [logStatus, setLogStatus] = useState<'pending' | 'done' | 'error'>('pending');
  /** undefined until the first coach reply lands; StartGate shows until then. */
  const [phase, setPhase] = useState<FlowPhase | undefined>();
  const [health, setHealth] = useState<Health | undefined>();
  const [muted, setMuted] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [theme, setTheme] = useState<Theme>(() => currentTheme());

  const coachRef = useRef<import('../core/coach.js').Coach | null>(null);
  /** Single shared audio element: one reply speaks at a time. */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextLineId = useRef(0);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  function toggleTheme(): void {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setStoredTheme(next);
    setTheme(next);
  }

  function pushLine(role: ChatLine['role'], text: string, phaseAt?: FlowPhase): number {
    const id = nextLineId.current++;
    setLines((prev) => [...prev, { id, role, text, phase: phaseAt }]);
    return id;
  }

  function attachAudio(id: number, url: string): void {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, audioUrl: url } : l)));
  }

  /**
   * Speaks one coach message through the relay's cloned voice, on the
   * shared audio element, and tracks which line is the one pulsing.
   * Best-effort: voice problems never break the text coaching flow.
   */
  async function speakCoachMessage(id: number, text: string): Promise<void> {
    if (muted) return;
    try {
      const { url } = await postSpeak(text);
      attachAudio(id, url);
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.pause();
      audio.src = url;
      audio.volume = 1;
      setSpeakingId(id);
      audio.onended = (): void => setSpeakingId(null);
      audio.onerror = (): void => setSpeakingId(null);
      await audio.play().catch(() => {
        setSpeakingId(null);
      });
    } catch {
      setSpeakingId(null);
    }
  }

  function replay(line: ChatLine): void {
    const url = line.audioUrl;
    if (url == null) return;
    audioRef.current?.pause();
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.src = url;
    setSpeakingId(line.id);
    audio.onended = (): void => setSpeakingId(null);
    audio.onerror = (): void => setSpeakingId(null);
    void audio.play().catch(() => setSpeakingId(null));
  }

  /**
   * Runs once the client clicks "Begin Check-in": a real user gesture, so
   * audio autoplay is allowed for the coach's opening line (today it is
   * silently text-only before this click).
   */
  async function begin(): Promise<void> {
    setBusy(true);
    setError(undefined);
    try {
      const [h, goalLogRaw] = await Promise.all([fetchHealth(), fetchGoalLog()]);
      setHealth(h);
      const goalLog = isGoalLogShape(goalLogRaw);
      // The Brain call is proxied through the relay; Coach Core stays pure.
      const coach = createCoach({ brain: postBrain, goalLog });
      coachRef.current = coach;
      const reply = await coach.open();
      setPhase(reply.phase);
      const id = pushLine('coach', reply.message, reply.phase);
      await speakCoachMessage(id, reply.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  /**
   * Appends the closed Check-in to the Goal Log. Fire-and-forget from
   * send(): navigation to SummaryCard follows `phase` alone, so a failed
   * append surfaces as an error inside the summary rather than stranding
   * the client on a half-closed main shell.
   */
  async function logCheckIn(state: ReturnType<import('../core/coach.js').Coach['state']>): Promise<void> {
    setLogStatus('pending');
    try {
      // recordFromState (the Goal Log module's own derivation) validates
      // every field and throws loudly if the Check-in lacks its TOWARD or
      // AWAY answers — never a silent empty outcome in the log.
      const record = recordFromState(state, localTimestamp());
      await postGoalLogAppend(record);
      setLogStatus('done');
    } catch (err: unknown) {
      setLogStatus('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function send(): Promise<void> {
    const text = draft.trim();
    const coach = coachRef.current;
    if (text === '' || coach == null || busy || phase === 'CLOSED') return;
    setBusy(true);
    setError(undefined);
    setDraft('');
    pushLine('user', text, phase);
    try {
      const reply: CoachReply = await coach.answer(text);
      setPhase(reply.phase);
      const id = pushLine('coach', reply.message, reply.phase);
      await speakCoachMessage(id, reply.message);
      if (reply.closed) {
        const state = coach.state();
        setFinalActionStep(state.actionStep);
        void logCheckIn(state);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function restart(): void {
    window.location.reload();
  }

  if (phase == null) {
    return <StartGate onBegin={() => void begin()} busy={busy} error={error} />;
  }

  if (phase === 'CLOSED') {
    return (
      <SummaryCard actionStep={finalActionStep} logStatus={logStatus} error={error} onRestart={restart} />
    );
  }

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.wordmark}>Future Self Coach</h1>
        <StatusMenu
          health={health}
          theme={theme}
          onToggleTheme={toggleTheme}
          onRestart={restart}
          restartDisabled={busy}
        />
      </header>

      <div className={styles.stepperRow}>
        <PhaseStepper phase={phase} />
      </div>

      <Transcript lines={lines} busy={busy} speakingId={speakingId} onReplay={replay} />

      {error != null && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.footer}>
        <Composer
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={() => void send()}
          disabled={busy || coachRef.current == null}
          placeholder="Type your answer…"
          voiceOn={health?.voice === 'on'}
          muted={muted}
          onToggleMute={() => {
            setMuted((m) => {
              if (!m) {
                audioRef.current?.pause();
                setSpeakingId(null); // pause() does not fire onended
              }
              return !m;
            });
          }}
        />
      </div>
    </main>
  );
}
