/**
 * One transcript line (ticket 08, restyled in ticket 03). Role is carried by
 * position and treatment (the coach flows left as plain text with a marker
 * while it is being spoken; the client's own words sit in a right-aligned
 * tinted bubble), not a "who" label. Replay is shown on coach lines that
 * have audio.
 */
import type React from 'react';
import { PlayIcon } from './icons.js';
import styles from './Message.module.css';

export interface MessageProps {
  role: 'coach' | 'user' | 'system';
  text: string;
  audioUrl?: string;
  speaking: boolean;
  onReplay: () => void;
}

export default function Message({ role, text, audioUrl, speaking, onReplay }: MessageProps): React.JSX.Element {
  if (role === 'system') {
    return <p className={styles.system}>{text}</p>;
  }

  return (
    <div className={role === 'user' ? styles.userRow : styles.coachRow}>
      <div className={role === 'user' ? styles.userBubble : styles.coachText} data-speaking={speaking || undefined}>
        <span className="srOnly">{role === 'user' ? 'You: ' : 'Coach: '}</span>
        {text}
      </div>
      {role === 'coach' && audioUrl != null && (
        <button type="button" className={styles.replay} aria-label="Replay this reply" onClick={onReplay}>
          <PlayIcon />
        </button>
      )}
    </div>
  );
}
