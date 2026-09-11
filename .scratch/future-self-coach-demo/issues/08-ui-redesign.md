# 08: Light, typographic UI redesign

**What to build:** replace the dark developer-theme chat screen with a light,
typographic design, and grow the surfaces the current screen is missing (start
gate, status menu, phase stepper, Action Step summary). Scope is the browser UI
only: Coach Core, the relay, the Brain and the Goal Log are untouched.

**Blocked by:** none (04 shipped).

**Status:** ready-for-agent

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

- [ ] Light theme by default on a system set to light; dark theme available
- [ ] Theme toggle in the status menu: two-state, follows
      `prefers-color-scheme` on first load, persists to `localStorage` after a
      manual choice, no flash of the wrong theme on reload (assumed)
- [ ] **Start gate**: wordmark, one line of framing, "Begin Check-in". Minimal
      by deliberate choice: it does not surface the prior Action Step, which
      stays owned by the Recall phase (assumed)
- [ ] Starting from the gate unlocks audio autoplay, so the coach's first line
      speaks aloud (today it is silently text-only)
- [ ] **Phase stepper**: three steps, Toward → Away → Action. Recall and
      Framing render as a lead-in label rather than dots; Enrollment folds into
      Action. Matches the `Check-in Phase` term in `CONTEXT.md` (assumed)
- [ ] Phase changes render as transition dividers in the transcript, not as a
      chip on every coach message (assumed)
- [ ] Message role is carried by position and treatment, not a label column
      (assumed)
- [ ] Replay control is a ghost button revealed on hover (assumed)
- [ ] Speaking pulse on the coach message while TTS plays
- [ ] Typing indicator while the Brain is working (stand-in for streaming,
      which is ticket 09) (assumed)
- [ ] **Status menu** behind a hamburger, right-aligned popover: brain status,
      voice status, theme toggle, "Start new Check-in" (assumed).
      **No on-screen degradation indicator**: a faked brain or absent voice
      config is visible only inside the menu (user's explicit choice; the
      trade-off is that a missing API key is not visible at a glance)
- [ ] Mute stays on-screen beside the composer, not in the menu (assumed)
- [ ] **Action Step summary card** replaces the dead-end closed state: the
      committed Action Step and its agreed date/time, confirmation that the
      Check-in was logged, and "Start new Check-in". Presentation only, from
      `coach.state()`; no Brain change (assumed)
- [ ] Header: wordmark left, hamburger right, stepper on its own row (assumed)
- [ ] Existing test suite still green; `npm run typecheck` clean

## Review

Screenshots of both themes at 1280x720, posted for review before the ticket
closes (assumed).

## Out of scope

- Streaming coach replies (ticket 09)
- A session summary generated by the Brain (aha moment, inspiration). The
  summary card shows the Action Step only.
- A landing or marketing page
