/**
 * One transcript line (ticket 08). Role is carried by position and
 * treatment (coach flows left as plain text; the client's own words sit in a
 * right-aligned bubble), not a "who" label column. The replay control is a
 * ghost button revealed on hover; the speaking pulse plays while this
 * message's audio is the one on the shared audio element.
 */
import type React from 'react';
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
          ▶
        </button>
      )}
    </div>
  );
}
