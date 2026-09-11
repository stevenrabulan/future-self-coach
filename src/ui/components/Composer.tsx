/**
 * The message input row (ticket 08). Mute stays here, beside the composer,
 * rather than moving into the status menu: it is a control the client
 * reaches for mid-conversation, not a diagnostic.
 */
import type React from 'react';
import styles from './Composer.module.css';

export interface ComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
  voiceOn: boolean;
  muted: boolean;
  onToggleMute: () => void;
}

export default function Composer({
  draft,
  onDraftChange,
  onSubmit,
  disabled,
  placeholder,
  voiceOn,
  muted,
  onToggleMute,
}: ComposerProps): React.JSX.Element {
  return (
    <form
      className={styles.composer}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {voiceOn && (
        <button
          type="button"
          className={styles.mute}
          aria-pressed={muted}
          aria-label={muted ? 'Unmute the coach' : 'Mute the coach'}
          onClick={onToggleMute}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
      <input
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Message to the coach"
        className={styles.input}
      />
      <button type="submit" className={styles.send} disabled={disabled || draft.trim() === ''}>
        Send
      </button>
    </form>
  );
}
