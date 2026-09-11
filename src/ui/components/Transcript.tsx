/**
 * The scrolling conversation (ticket 08). Phase changes render as transition
 * dividers between messages, replacing the old per-message phase chip. The
 * typing indicator stands in for streaming (ticket 09).
 */
import { useEffect, useRef } from 'react';
import type React from 'react';
import type { FlowPhase } from '../../core/types.js';
import { PHASE_LABEL } from '../phase-labels.js';
import Message from './Message.js';
import styles from './Transcript.module.css';

export interface ChatLine {
  id: number;
  role: 'coach' | 'user' | 'system';
  text: string;
  phase?: FlowPhase;
  audioUrl?: string;
}

export interface TranscriptProps {
  lines: ChatLine[];
  busy: boolean;
  speakingId: number | null;
  onReplay: (line: ChatLine) => void;
}

export default function Transcript({ lines, busy, speakingId, onReplay }: TranscriptProps): React.JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, busy]);

  let lastPhase: FlowPhase | undefined;

  return (
    <div className={styles.transcript} ref={scrollRef}>
      {lines.map((l) => {
        const showDivider = l.phase != null && l.phase !== lastPhase;
        if (l.phase != null) lastPhase = l.phase;
        return (
          <div key={l.id}>
            {showDivider && l.phase != null && (
              <div className={styles.divider}>
                <span>{PHASE_LABEL[l.phase]}</span>
              </div>
            )}
            <Message
              role={l.role}
              text={l.text}
              audioUrl={l.audioUrl}
              speaking={l.id === speakingId}
              onReplay={() => onReplay(l)}
            />
          </div>
        );
      })}
      {busy && (
        <div className={styles.typing} aria-live="polite">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      )}
    </div>
  );
}
