/**
 * Theme persistence (ticket 08). Follows `prefers-color-scheme` until the
 * client makes an explicit choice, then persists that choice to
 * localStorage. The no-flash inline script in index.html duplicates the
 * storage key and read logic so it can run before any paint; keep the two in
 * sync if this key ever changes.
 */
export const THEME_STORAGE_KEY = 'fsc-theme';

export type Theme = 'light' | 'dark';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

/** The client's explicit choice, if they have made one. */
export function getStoredTheme(): Theme | undefined {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : undefined;
  } catch (err) {
    // localStorage can throw (private browsing, storage disabled). Not
    // fatal — falls back to the system theme — but never silent.
    console.warn('theme: could not read stored theme, falling back to system', err);
    return undefined;
  }
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** The theme actually in effect right now: the explicit choice, or system. */
export function currentTheme(): Theme {
  return getStoredTheme() ?? systemTheme();
}

/** Records an explicit choice and applies it immediately. */
export function setStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (err) {
    // Not fatal — the toggle still applies for this page view — but never
    // silent: the choice won't survive a reload, which is worth knowing.
    console.warn('theme: could not persist theme choice; it will not survive a reload', err);
  }
  document.documentElement.setAttribute('data-theme', theme);
}
