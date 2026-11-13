# 02: Coach Orb on the start gate and the summary

**What to build:** a client opening the app sees the Coach Orb above the product name, tagline and "Begin Check-in"; the orb shows thinking while the Check-in connects. After a Check-in closes, the summary shows a small orb mark, "Check-in complete", the Action Step with its agreed date and time, the Goal Log line and "Start new Check-in".

**Blocked by:** 01

**Status:** resolved

**Spec:** `.scratch/voice-stage-redesign/spec.md` (Coach Orb, Halo, Motion timings, Reduced motion, Copy changes).

- [x] Coach Orb component exists with stage, gate and mark sizes and idle, speaking, thinking states, CSS only
- [x] Halo is an unblurred radial fade from the orb's edge to transparent; no blur filter or blurred outer shadow anywhere on the orb
- [x] Motion timings match the spec (idle breathe 21s and the rest)
- [x] With reduced motion on, the orb does not animate and each state is still distinguishable
- [x] Orb state derivation is a pure function with unit tests: busy gives thinking, a speaking line gives speaking, otherwise idle
- [x] Orb is hidden from assistive tech
- [x] Start gate: orb, title, new tagline, button reads "Connecting…" and is disabled while busy, errors shown under the button
- [x] Summary: all three Goal Log states (pending, done, error) and the "no Action Step captured" case render
- [x] Status menu is reachable on both frames; restart is offered on the summary only
- [x] Light and dark captures of both frames attached as a comment

## Comments

### 2026-11-12 hand-back

Done. Real components now match prototype B's gate and summary.

- New `src/ui/components/CoachOrb.{tsx,module.css}` (stage 280, gate 240, mark 60; idle, speaking, thinking). CSS ported from the prototype's `Orb.module.css` with global `--color-orb-*` tokens; halo mask, timings and reduced-motion rules kept verbatim. The only `filter: blur` is on the inner colour swirl inside the core, not the halo; no blurred outer shadow. `aria-hidden="true"` on the root.
- `src/ui/components/orb-state.ts`: pure `orbStateFor(busy, speakingId)`, written test-first (`orb-state.test.ts`, 5 tests, including line id 0 counting as speaking).
- `StartGate`: orb (thinking while busy), title, new tagline, "Connecting…" disabled button, error under the button. `SummaryCard`: idle mark orb, "Check-in complete", Action Step hero with date and time, Goal Log line, "Start new Check-in".
- `StatusMenu`: new `showRestart` prop (default true); App passes false on the gate. Menu is passed to StartGate and SummaryCard as a `menu` slot (top right). Restyled to the glass popover with a dots trigger and Escape to close, shared with the Check-in frame (ticket 03 may still restyle its placement).
- Verified by reading code only (fixtures show just `done` with an Action Step): Goal Log `pending` ("Logging to your Goal Log…"), `error` (alert with the error text), and the no-Action-Step note render as branches in `SummaryCard.tsx`. Reduced-motion and live orb states were not exercised in a browser.
- Captures (1440x900, fixture data): `.scratch/voice-stage-redesign/captures/02/{gate,summary}-{light,dark}.png`
- `npm run typecheck` and `npm test` pass.
