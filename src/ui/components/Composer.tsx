/**
 * The message input row (ticket 08, restyled in ticket 03): a single-line
 * input with an icon send button. Mute lives on the stage's voice controls,
 * not here. Disabled while the coach is thinking; send also needs a
 * non-empty draft.
 */
import type React from 'react';
import styles from './Composer.module.css';
import { SendIcon } from './icons.js';

export interface ComposerProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
}

export default function Composer({
  draft,
  onDraftChange,
  onSubmit,
  disabled,
  placeholder,
}: ComposerProps): React.JSX.Element {
  return (
    <form
      className={styles.composer}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Message to the coach"
        className={styles.input}
      />
      <button type="submit" className={styles.send} aria-label="Send" disabled={disabled || draft.trim() === ''}>
        <SendIcon />
      </button>
    </form>
  );
}
