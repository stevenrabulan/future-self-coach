/**
 * One-screen chat UI (ticket 04): the Future Self Coach in the browser.
 * Coach Core runs client-side against the relay's Brain; the Goal Log is
 * loaded at Check-in start and appended on close. Keys stay server-side:
 * the UI never touches OpenRouter directly.
 *
 * Phase markers are rendered inline so the Coaching Flow (Framing,
 * TOWARD → AWAY → ACTION, enrollment) is visible in the transcript.
 */
import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { createCoach } from '../core/coach.js';
import type { CoachReply, GoalLog } from '../core/types.js';
import { recordFromState } from '../log/goal-log.js';
import {
  fetchGoalLog,
  fetchHealth,
  postBrain,
  postGoalLogAppend,
  postSpeak,
  type Health,
} from './relay-client.js';

interface ChatLine {
  role: 'coach' | 'user' | 'system';
  text: string;
  phase?: string;
  /** Set on coach lines: the audio object URL for this reply (ticket 05). */
  audioUrl?: string;
}

const PHASE_LABEL: Record<string, string> = {
  RECALL: 'Recall',
  FRAMING: 'Framing Questions',
  TOWARD: 'Toward',
  AWAY: 'Away',
  ACTION: 'Action Step',
  ENROLL: 'Enrollment',
  CLOSED: 'Complete',
};

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
  const [closed, setClosed] = useState(false);
  const [phase, setPhase] = useState<string>('starting');
  const [health, setHealth] = useState<Health | undefined>();
  /** Voice on/off: the relay's ElevenLabs config, plus the local mute. */
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const coachRef = useRef<import('../core/coach.js').Coach | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Single shared audio element: one reply speaks at a time. */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Latest user interaction; audio autoplay is allowed after it. */
  const interactedRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  useEffect(() => {
    const markInteracted = (): void => {
      interactedRef.current = true;
    };
    window.addEventListener('pointerdown', markInteracted, { once: true });
    window.addEventListener('keydown', markInteracted, { once: true });
    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
      audioRef.current?.pause();
    };
  }, []);

  function line(role: ChatLine['role'], text: string, phase?: string, audioUrl?: string): void {
    setLines((prev) => [...prev, { role, text, phase, audioUrl }]);
  }

  /**
   * Speaks one coach message through the relay's cloned voice. Best-effort:
   * voice problems never break the text coaching flow (ticket 05).
   */
  async function speakCoachMessage(text: string, interacted: boolean): Promise<string | undefined> {
    if (muted || !interacted) return undefined;
    try {
      const { url } = await postSpeak(text);
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.pause();
      audio.src = url;
      audio.volume = 1;
      setSpeaking(true);
      audio.onended = (): void => setSpeaking(false);
      audio.onerror = (): void => setSpeaking(false);
      await audio.play().catch(() => {
        setSpeaking(false);
      });
      return url;
    } catch {
      setSpeaking(false);
      return undefined;
    }
  }

  useEffect(() => {
    let cancelled = false;
    const boot = async (): Promise<void> => {
      try {
        const h = await fetchHealth();
        if (cancelled) return;
        setHealth(h);
        const goalLog = isGoalLogShape(await fetchGoalLog());
        if (cancelled) return;
        // The Brain call is proxied through the relay; Coach Core stays pure.
        const coach = createCoach({ brain: postBrain, goalLog });
        coachRef.current = coach;
        const reply = await coach.open();
        if (cancelled) return;
        setPhase(reply.phase);
        // No interaction yet (page just loaded): autoplay policies would
        // block playback, so the first coach line is text-only.
        const audioUrl = await speakCoachMessage(reply.message, interactedRef.current);
        line('coach', reply.message, reply.phase, audioUrl);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(): Promise<void> {
    const text = draft.trim();
    const coach = coachRef.current;
    if (text === '' || coach == null || busy || closed) return;
    setBusy(true);
    setError(undefined);
    setDraft('');
    line('user', text);
    try {
      const reply: CoachReply = await coach.answer(text);
      setPhase(reply.phase);
      // After a send the user has interacted, so playback is allowed.
      const audioUrl = await speakCoachMessage(reply.message, true);
      line('coach', reply.message, reply.phase, audioUrl);
      if (reply.closed) {
        setClosed(true);
        const state = coach.state();
        // recordFromState (the Goal Log module's own derivation) validates
        // every field and throws loudly if the Check-in lacks its TOWARD or
        // AWAY answers — never a silent empty outcome in the log.
        const record = recordFromState(state, localTimestamp());
        await postGoalLogAppend(record);
        line('system', 'Check-in logged to the Goal Log.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app">
      <header className="header">
        <h1>Future Self Coach</h1>
        <span className="badge" data-brain={health?.brain ?? 'unknown'}>
          {health == null
            ? 'connecting…'
            : health.brain === 'real'
              ? `live brain · ${health.model ?? 'custom model'}`
              : 'faked brain (no API key)'}
        </span>
        <span className="badge" data-voice={health?.voice ?? 'unknown'}>
          {health?.voice === 'on'
            ? `voice ${muted ? 'muted' : speaking ? 'speaking…' : 'on'}`
            : 'voice off (no ElevenLabs config)'}
        </span>
        {health?.voice === 'on' && (
          <button
            type="button"
            className="mute"
            onClick={() => {
              setMuted((m) => {
                if (!m) {
                  audioRef.current?.pause();
                  setSpeaking(false); // pause() does not fire onended
                }
                return !m;
              });
            }}
          >
            {muted ? 'Unmute' : 'Mute'}
          </button>
        )}
      </header>

      <div className="phasebar">
        Check-in phase: <strong>{PHASE_LABEL[phase] ?? phase}</strong>
      </div>

      <div className="transcript" ref={scrollRef}>
        {lines.map((l, i) => (
          <div key={i} className={`line line-${l.role}`}>
            <span className="who">{l.role === 'coach' ? 'Coach' : l.role === 'user' ? 'You' : ''}</span>
            <span className="text">
              {l.phase != null && l.role === 'coach' && (
                <span className="phase-tag">{PHASE_LABEL[l.phase] ?? l.phase}</span>
              )}
              {l.text}
              {l.audioUrl != null && (
                <button
                  type="button"
                  className="replay"
                  aria-label="Replay this reply"
                  onClick={() => {
                    audioRef.current?.pause();
                    const audio = audioRef.current ?? new Audio();
                    audioRef.current = audio;
                    const url = l.audioUrl;
                    if (url == null) return;
                    audio.src = url;
                    setSpeaking(true);
                    audio.onended = (): void => setSpeaking(false);
                    audio.onerror = (): void => setSpeaking(false);
                    void audio.play().catch(() => setSpeaking(false));
                  }}
                >
                  ▶
                </button>
              )}
            </span>
          </div>
        ))}
        {busy && <div className="line line-system"><span className="text">Coach is thinking…</span></div>}
      </div>

      {error != null && <div className="error" role="alert">{error}</div>}

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={closed ? 'Check-in complete. Restart the app for the next one.' : 'Type your answer…'}
          disabled={busy || closed || coachRef.current == null}
          aria-label="Message to the coach"
        />
        <button type="submit" disabled={busy || closed || draft.trim() === ''}>
          Send
        </button>
      </form>
    </main>
  );
}
