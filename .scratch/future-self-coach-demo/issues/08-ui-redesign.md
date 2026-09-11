# 08: Light, typographic UI redesign

**What to build:** replace the dark developer-theme chat screen with a light,
typographic design, and grow the surfaces the current screen is missing (start
gate, status menu, phase stepper, Action Step summary). Scope is the browser UI
only: Coach Core, the relay, the Brain and the Goal Log are untouched.

**Blocked by:** none (04 shipped).

**Status:** ready-for-human

**Decisions:** see `docs/adr/0004-css-modules-native-css.md`. Settled in a
grilling session on 2026-09-10. Items marked (assumed) were settled under
silent consent and can still be vetoed.

## Design language

- **References**: OpenAI for the transcript skeleton, Stripe for chrome
  discipline (buttons, focus rings, menu card, 4px spacing base), Apple's
  whitespace on the opening and closing frames. ElevenLabs contributes nothing
  structural. (assumed)
- **Typography**: Libre Franklin, self-hosted via
  `@fontsource-variable/libre-franklin`, Latin subset, `font-display: swap`,
  preloaded. Headings 700 weight with `-0.02em` letter-spacing at 20px+ and
  `-0.03em` at 32px. Body 15px / 1.6. Scale: 13 / 14 / 15 / 17 / 20 / 32.
  Self-hosting (assumed) avoids a fonts.gstatic.com round-trip mid-recording.
- **Light palette**: page `#FAFAF9`, surfaces `#FFFFFF`, text `#0A0A0A`, muted
  `#71717A`, borders `#E4E4E7`, accent `#4B2DE2` (7.6:1 on white, passes AA for
  white-on-accent fills). Accent is reserved for send, focus rings and the
  active stepper step.
- **Dark palette** (assumed): explicit paired values per token, never an
  inversion. Page `#0C0C0D`, surfaces `#161617`, text `#FAFAFA`, muted
  `#A1A1AA`, borders `#27272A`. Accent lifts to `#7C5CFF` for text, borders and
  the active step; `#4B2DE2` is retained for white-text-on-accent fills.
- **Radii**: 8 / 12 / 999. **Spacing**: 4px base.
- **Motion** (assumed): 160ms ease-out, opacity plus 4px rise on message entry.
  Speaking pulse is a 2s opacity breathe, not a waveform.
  `prefers-reduced-motion: reduce` disables entrance transitions and the pulse.
- **Viewport** (assumed): desktop-first, composed for a 1280x720 capture.
  Reading column ~760px; header and composer may run wider. Mobile degrades
  gracefully but is not designed for.

## Implementation

- **CSS Modules plus native CSS**, one `*.module.css` per component. No
  preprocessor, no utility framework, no component library.
- Global `src/ui/styles/tokens.css` and `reset.css`, imported in `main.tsx`.
  Light tokens on bare `:root`; dark under `:root[data-theme="dark"]`; system
  default under `@media (prefers-color-scheme: dark)` guarded as
  `:root:not([data-theme="light"])`. (assumed)
- camelCase class names (assumed). Loose CSS Modules typing accepted; no
  `.d.ts` codegen.
- `App.tsx` splits into `StartGate`, `PhaseStepper`, `Transcript`, `Message`,
  `Composer`, `StatusMenu`, `SummaryCard` (assumed). State stays in `App`;
  children are presentational.
- New dependency: `@fontsource-variable/libre-franklin`. No `sass`.

## Acceptance criteria

- [x] Light theme by default on a system set to light; dark theme available
- [x] Theme toggle in the status menu: two-state, follows
      `prefers-color-scheme` on first load, persists to `localStorage` after a
      manual choice, no flash of the wrong theme on reload (assumed)
- [x] **Start gate**: wordmark, one line of framing, "Begin Check-in". Minimal
      by deliberate choice: it does not surface the prior Action Step, which
      stays owned by the Recall phase (assumed)
- [x] Starting from the gate unlocks audio autoplay, so the coach's first line
      speaks aloud (today it is silently text-only)
- [x] **Phase stepper**: three steps, Toward → Away → Action. Recall and
      Framing render as a lead-in label rather than dots; Enrollment folds into
      Action. Matches the `Check-in Phase` term in `CONTEXT.md` (assumed)
- [x] Phase changes render as transition dividers in the transcript, not as a
      chip on every coach message (assumed)
- [x] Message role is carried by position and treatment, not a label column
      (assumed)
- [x] Replay control is a ghost button revealed on hover (assumed)
- [x] Speaking pulse on the coach message while TTS plays
- [x] Typing indicator while the Brain is working (stand-in for streaming,
      which is ticket 09) (assumed)
- [x] **Status menu** behind a hamburger, right-aligned popover: brain status,
      voice status, theme toggle, "Start new Check-in" (assumed).
      **No on-screen degradation indicator**: a faked brain or absent voice
      config is visible only inside the menu (user's explicit choice; the
      trade-off is that a missing API key is not visible at a glance)
- [x] Mute stays on-screen beside the composer, not in the menu (assumed)
- [x] **Action Step summary card** replaces the dead-end closed state: the
      committed Action Step and its agreed date/time, confirmation that the
      Check-in was logged, and "Start new Check-in". Presentation only, from
      `coach.state()`; no Brain change (assumed)
- [x] Header: wordmark left, hamburger right, stepper on its own row (assumed)
- [x] Existing test suite still green; `npm run typecheck` clean

## Review

Screenshots of both themes at 1280x720, posted for review before the ticket
closes (assumed).

## Out of scope

- Streaming coach replies (ticket 09)
- A session summary generated by the Brain (aha moment, inspiration). The
  summary card shows the Action Step only.
- A landing or marketing page

## Comments

Implemented 2026-09-11: all seven components (`StartGate`, `PhaseStepper`,
`Transcript`, `Message`, `Composer`, `StatusMenu`, `SummaryCard`), the
token/reset stylesheets, and the no-flash theme bootstrap per ADR 0004.
Verified end-to-end in a real browser (light + dark, full Check-in flow
including a Goal Log append failure path) and via the existing test suite +
`npm run typecheck`, both green.

A code review (8-angle finder pass) surfaced one real correctness bug worth
flagging beyond the acceptance criteria: `closed` was tracked as a separate
boolean that lagged behind `phase`, so a slow or failed Goal Log append could
strand the client on the main shell with a broken-looking stepper and a live
composer against an already-closed Coach Core. Fixed by routing off
`phase === 'CLOSED'` directly and moving the append's own success/failure into
a `logStatus` shown on the SummaryCard instead of gating navigation. Also
fixed in the same pass: a wrong CSS token on the replay button's hover state
(dark-mode contrast), a dead CSS Modules class reference, sequential instead
of parallel health/goal-log fetches on Begin, a keyboard-focus gap on the
replay button, a missing screen-reader role cue on transcript messages,
silently-swallowed localStorage errors, and duplicated phase-label text
between two components.

Screenshots (1280x720, both themes) sent to Steve for review per the Review
section above.
