/**
 * Diagnostics behind a hamburger (ticket 08): brain status, voice status,
 * the theme toggle, and "Start new Check-in". Deliberately the only place a
 * faked brain or missing voice config is visible, no on-screen degradation
 * indicator elsewhere, so a missing API key is not visible at a glance.
 */
import { useEffect, useState } from 'react';
import type React from 'react';
import type { Health } from '../relay-client.js';
import type { Theme } from '../theme.js';
import styles from './StatusMenu.module.css';

export interface StatusMenuProps {
  health?: Health;
  theme: Theme;
  onToggleTheme: () => void;
  onRestart: () => void;
  /** True while a request is in flight: restarting mid-save would abort the
   * Goal Log append with no confirmation of whether it landed. */
  restartDisabled?: boolean;
  /** Offer "Start new Check-in". False on the start gate, where there is
   * nothing to restart. Defaults to true. */
  showRestart?: boolean;
}

export default function StatusMenu({
  health,
  theme,
  onToggleTheme,
  onRestart,
  restartDisabled,
  showRestart = true,
}: StatusMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Status menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.4" />
          <circle cx="12" cy="12" r="1.4" />
          <circle cx="19" cy="12" r="1.4" />
        </svg>
      </button>
      {open && (
        <>
          <button type="button" className={styles.backdrop} aria-label="Close status menu" onClick={() => setOpen(false)} />
          <div className={styles.popover} role="menu">
            <div className={styles.row}>
              <span className={styles.rowLabel}>Brain</span>
              <span className={styles.rowValue} data-ok={health?.brain === 'real' || undefined}>
                {health == null ? 'connecting…' : health.brain === 'real' ? (health.model ?? 'live') : 'faked (no API key)'}
              </span>
            </div>
            <div className={styles.row}>
              <span className={styles.rowLabel}>Voice</span>
              <span className={styles.rowValue} data-ok={health?.voice === 'on' || undefined}>
                {health?.voice === 'on' ? 'on' : 'off (no ElevenLabs config)'}
              </span>
            </div>
            <button
              type="button"
              className={styles.item}
              role="menuitem"
              onClick={() => {
                onToggleTheme();
              }}
            >
              {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            </button>
            {showRestart && (
              <button
                type="button"
                className={styles.item}
                role="menuitem"
                disabled={restartDisabled}
                onClick={() => {
                  setOpen(false);
                  onRestart();
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
