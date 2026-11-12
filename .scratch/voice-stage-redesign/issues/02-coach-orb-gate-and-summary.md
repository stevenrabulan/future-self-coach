# 02: Coach Orb on the start gate and the summary

**What to build:** a client opening the app sees the Coach Orb above the product name, tagline and "Begin Check-in"; the orb shows thinking while the Check-in connects. After a Check-in closes, the summary shows a small orb mark, "Check-in complete", the Action Step with its agreed date and time, the Goal Log line and "Start new Check-in".

**Blocked by:** 01

**Status:** ready-for-agent

**Spec:** `.scratch/voice-stage-redesign/spec.md` (Coach Orb, Halo, Motion timings, Reduced motion, Copy changes).

- [ ] Coach Orb component exists with stage, gate and mark sizes and idle, speaking, thinking states, CSS only
- [ ] Halo is an unblurred radial fade from the orb's edge to transparent; no blur filter or blurred outer shadow anywhere on the orb
- [ ] Motion timings match the spec (idle breathe 21s and the rest)
- [ ] With reduced motion on, the orb does not animate and each state is still distinguishable
- [ ] Orb state derivation is a pure function with unit tests: busy gives thinking, a speaking line gives speaking, otherwise idle
- [ ] Orb is hidden from assistive tech
- [ ] Start gate: orb, title, new tagline, button reads "Connecting…" and is disabled while busy, errors shown under the button
- [ ] Summary: all three Goal Log states (pending, done, error) and the "no Action Step captured" case render
- [ ] Status menu is reachable on both frames; restart is offered on the summary only
- [ ] Light and dark captures of both frames attached as a comment
