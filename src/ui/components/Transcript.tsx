/**
 * The scrolling conversation (ticket 08, regrouped in ticket 03). Lines are
 * grouped under a heading per Check-in Phase; the line being spoken is
 * marked; coach lines with audio offer replay; a thinking indicator shows
 * while the Brain replies; the view follows the newest line.
 */
import { useEffect, useRef } from 'react';
import type React from 'react';
import type { FlowPhase } from '../../core/types.js';
import { PHASE_LABEL } from '../phase-labels.js';
import Message from './Message.js';
import styles from './Transcript.module.css';
import { groupByPhase } from './transcript-lines.js';

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

  const groups = groupByPhase(lines);
  // A lone heading (Recall or Framing at the start) says nothing: headings
  // appear once a second Check-in Phase has begun.
  const showDividers = groups.filter((g) => g.phase != null).length > 1;

  return (
    <div className={styles.transcript} ref={scrollRef}>
      {groups.map((group, i) => (
        <section key={`${i}-${group.phase ?? 'none'}`} className={styles.group}>
          {showDividers && group.phase != null && <h2 className={styles.divider}>{PHASE_LABEL[group.phase]}</h2>}
          {group.lines.map((l) => (
            <Message
              key={l.id}
              role={l.role}
              text={l.text}
              audioUrl={l.audioUrl}
              speaking={l.id === speakingId}
              onReplay={() => onReplay(l)}
            />
          ))}
        </section>
      ))}
      {busy && (
        <div className={styles.typing} role="status">
          <span className="srOnly">Coach is thinking</span>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      )}
    </div>
  );
}
