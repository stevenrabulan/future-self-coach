/**
 * PROTOTYPE (throwaway). Floating bar: cycle variants (arrow keys too) and
 * jump between frames. Deliberately styled unlike any variant so it is
 * obviously not part of the design under review. Dev builds only.
 */
import { useEffect, useState } from 'react';
import type React from 'react';
import type { FrameKey, VariantKey } from './types.js';
import styles from './PrototypeSwitcher.module.css';

export const VARIANTS: { key: VariantKey; name: string }[] = [
  { key: 'current', name: 'Current app' },
  { key: 'A', name: 'One question at a time' },
  { key: 'B', name: 'Voice stage' },
  { key: 'C', name: 'Transcript with side rail' },
];
const FRAMES: { key: FrameKey; label: string }[] = [
  { key: 'live', label: 'Live' },
  { key: 'gate', label: 'Start' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'summary', label: 'Summary' },
];

export interface PrototypeSwitcherProps {
  variant: VariantKey;
  frame: FrameKey;
  onChange: (variant: VariantKey, frame: FrameKey) => void;
}

export default function PrototypeSwitcher({ variant, frame, onChange }: PrototypeSwitcherProps): React.JSX.Element {
  // Collapsible (click the dot, or press H) so it never hides a composer; `?bar=0` starts collapsed.
  const [collapsed, setCollapsed] = useState(() => new URLSearchParams(window.location.search).get('bar') === '0');
  const index = VARIANTS.findIndex((v) => v.key === variant);
  const step = (delta: number): void => {
    const next = VARIANTS[(index + delta + VARIANTS.length) % VARIANTS.length];
    if (next != null) onChange(next.key, frame);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const t = e.target as HTMLElement | null;
      if (t != null && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'h' || e.key === 'H') setCollapsed((c) => !c);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (collapsed) {
    return (
      <button type="button" className={styles.dot} aria-label="Show prototype switcher" onClick={() => setCollapsed(false)}>
        {variant === 'current' ? '·' : variant}
      </button>
    );
  }

  return (
    <div className={styles.bar} data-prototype-switcher>
      <button type="button" className={styles.arrow} aria-label="Previous variant" onClick={() => step(-1)}>←</button>
      <span className={styles.label}>
        <b>{variant === 'current' ? '·' : variant}</b> {VARIANTS[index]?.name}
      </span>
      <button type="button" className={styles.arrow} aria-label="Next variant" onClick={() => step(1)}>→</button>
      <span className={styles.sep} />
      {FRAMES.map((f) => (
        <button
          key={f.key}
          type="button"
          className={styles.frame}
          aria-pressed={f.key === frame}
          onClick={() => onChange(variant, f.key)}
        >
          {f.label}
        </button>
      ))}
      <button type="button" className={styles.arrow} aria-label="Hide prototype switcher (H)" onClick={() => setCollapsed(true)}>×</button>
    </div>
  );
}
