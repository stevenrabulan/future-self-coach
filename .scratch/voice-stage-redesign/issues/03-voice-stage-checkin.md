# 03: Voice stage Check-in screen

**What to build:** during a Check-in the client sees the stage (Toward, Away, Action steps on top, the Coach Orb, the coach's latest line as a caption, mute and replay) beside a panel with the full transcript and the composer. The orb is thinking while the Brain replies and speaking while the Voice Clone plays.

**Blocked by:** 02

**Status:** resolved

**Spec:** `.scratch/voice-stage-redesign/spec.md` (Check-in layout, Phase stepper, Caption, Composer, Component set).

- [x] Two-column layout: stage left, glass transcript panel right; columns stack below about 860px with the stage first
- [x] Stepper shows done, active, pending; Recall and Framing show the lead-in sentence; Enrollment counts as Action
- [x] Caption shows the latest coach line, is announced politely, and is marked while spoken
- [x] Mute and replay sit under the orb; hidden when voice is off and no audio exists; the mute toggle is gone from the composer
- [x] Transcript groups lines by Check-in Phase, marks the speaking line, offers replay on coach lines with audio, shows a thinking indicator while busy, and scrolls to the newest line
- [x] Composer is disabled while busy; send is disabled on an empty draft; placeholder reads "Type your reply"
- [x] Errors show in the panel above the composer
- [x] Every control has a visible focus ring and is reachable by keyboard
- [x] Live pass: one full Check-in against the relay with voice on, orb seen in idle, thinking and speaking, Action Step logged
- [x] Captures attached: light and dark at 1440x900, one at 390 wide, one with reduced motion
- [x] Muted text on the glass panel meets AA contrast in both themes (measured, values in the comment)

## Comments

### 2026-11-12 hand-back

Built and checked against fixture data; one box left (live pass), which needs the user.

**What changed**
- New `CoachStage` (orb, caption in a polite live region, mute and replay group, hidden when voice is off and no audio exists). Stepper and status menu are slots in its top bar.
- Restyled `PhaseStepper` (pills, `aria-current="step"`), `Transcript` (a `<section>` and heading per Check-in Phase, speaking line marked, thinking indicator, scroll to newest), `Message` (icon replay on coach lines with audio), `Composer` (single line, icon send, placeholder "Type your reply", mute removed).
- `App.tsx` main-shell branch is now stage + glass panel (transcript, error, composer); `App.module.css` holds the grid, stacking below 860px with the stage first. Composer `disabled` logic unchanged. Prototype plumbing untouched (ticket 04).
- Pure helpers `latestCoachLine` and `groupByPhase` in `transcript-lines.ts`, written test-first (`transcript-lines.test.ts`, 6 tests).
- `npm run typecheck` clean; `npm test` 115 passed across 12 files.

**Captures** (fixture data), `.scratch/voice-stage-redesign/captures/03/`:
- `checkin-light.png`, `checkin-dark.png` (1440x900)
- `checkin-390.png` (390 wide; taken through a 390px iframe because headless Chrome clamps its window to about 500px, which clipped the plain 390 capture, the prototype did the same). Stacks stage first, nothing cut off, orb 176px.
- `checkin-reduced-motion.png` (speaking: static rings, slightly off-round core)
- Gate and summary re-captured in light and dark after the change: no regression.

**Contrast** (muted text on the glass panel, panel blended over the page background, WCAG ratio; computed with a python one-off). Worst case also taken over the peak of each ambient wash:
- Light: `#5b5877` on panel over `#f6f5fb` = 6.56:1; worst over a wash peak 6.00:1
- Dark: `#a3a0c6` on panel over `#06051a` = 7.69:1; worst over a wash peak 6.86:1
- All pass AA (4.5:1). No token changed.

**Keyboard and focus**: verified by reading markup and CSS, not by tabbing in a browser. Every control is a real `<button>` or `<input>` (mute, replay, send, status menu, composer), none has `tabindex=-1` or `outline: none`, so the global `:focus-visible` ring in `reset.css` applies. Mute has `aria-pressed`; icon buttons have `aria-label`.

**Decisions logged**
- Latest-coach-line and phase grouping extracted and unit tested; no component tests added.
- Stepper and menu passed to `CoachStage` as slots, so the stage stays presentational.
- Phase headings are `<h2>` in a `<section>` per group (the prototype used divs).
- Shared icons in `components/icons.tsx`.
- Per-stage ambient wash dropped: the global body gradient from ticket 01 is used.

**Live pass: left for you** (calls your paid OpenRouter and ElevenLabs accounts and appends to your real Goal Log, so I did not start the relay):
1. `npm run dev`, open the app URL it prints (no `?frame=` params).
2. Click "Begin Check-in". The orb on the gate should show thinking (spinning arc), then the stage appears.
3. Idle: orb breathes slowly while you read. Type a reply and send: composer and send disable, orb goes thinking, transcript shows the three dots.
4. Speaking: when the voice plays, orb pulses with rings, the caption is full colour, and the transcript line shows a violet left marker. Replay and mute under the orb work; muting stops audio and the orb returns to idle.
5. Step through Toward, Away, Action: stepper pills update, transcript grows a heading per phase.
6. After the Action Step, the summary shows the step and time, and "Logged to your Goal Log." Open `goal-log` and check the new entry.
7. If all good, tick the live pass box and set status to resolved.

**2026-11-13:** live pass done by the user: a full Check-in with voice on, orb motion and state fades in a real browser, and reduced motion. Resolved.
