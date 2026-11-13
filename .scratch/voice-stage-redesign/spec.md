# Spec: voice stage redesign

**Status:** ready-for-agent

**Decisions:** `docs/adr/0005-voice-stage-ui.md` (layout, look, Coach Orb) and
`docs/adr/0004-css-modules-native-css.md` (styling approach, still in force).

**Primary source:** the working prototype is "Voice stage" (variant B) under
the UI's `prototype` folder on branch `claude/app-redesign-prototypes-6be469`.
Open `/?variant=B&frame=checkin` in dev. It is throwaway code: copy its
decisions, not its structure.

Items marked (assumed) were settled under silent consent and can be vetoed.

## Problem Statement

The Future Self Coach speaks in my own Voice Clone, but the screen is a chat
transcript. Nothing on it shows that someone is speaking to me, and the app
looks like a developer demo, not a finished product.

## Solution

The Check-in screen becomes a voice stage. A Coach Orb sits at the centre and
shows whether the coach is idle, speaking or thinking. The coach's latest line
is a caption under it, with mute and replay beside it. The full transcript and
the composer move to a panel on the right. The start gate and the Action Step
summary use the same orb and look. The Check-in itself (Coaching Flow, Goal
Log, relay calls) does not change.

## User Stories

1. As a client, I want to see a Coach Orb when I open the app, so that I know I am about to talk to someone, not fill in a form.
2. As a client, I want one clear "Begin Check-in" button on the start gate, so that I know how to start.
3. As a client, I want the start button to say it is connecting while the Check-in loads, so that I do not click twice.
4. As a client, I want the Coach Orb to change when the coach is speaking, so that I can tell the voice I hear belongs to the screen.
5. As a client, I want the Coach Orb to change when the coach is thinking, so that I know my answer was received.
6. As a client, I want the Coach Orb to pulse slowly, so that it does not distract me while I think about my answer.
7. As a client, I want the orb's halo to fade evenly from its edge outward, so that it reads as light and not as a smudge.
8. As a client, I want the coach's latest line as a caption under the orb, so that I can read what I just heard.
9. As a client, I want to mute the coach from the stage, so that I can continue the Check-in in silence.
10. As a client, I want to replay the coach's latest line from the stage, so that I can hear it again without scrolling.
11. As a client, I want the voice controls hidden when voice is off, so that I am not offered buttons that do nothing.
12. As a client, I want to see Toward, Away and Action as steps above the orb, so that I know where I am in the Check-in.
13. As a client, I want a short lead-in label during Recall and Framing in place of the steps, so that I am not shown a step I have not reached.
14. As a client, I want the whole transcript in a side panel, so that I can reread earlier turns.
15. As a client, I want the transcript grouped by Check-in Phase, so that I can find my Toward and Away answers.
16. As a client, I want to replay any earlier coach line from the transcript, so that I can hear a specific line again.
17. As a client, I want the line being spoken marked in the transcript, so that I can follow along.
18. As a client, I want the composer at the bottom of the panel, so that I always know where to type.
19. As a client, I want the composer and send button disabled while the coach is thinking, so that I do not send twice.
20. As a client, I want errors shown next to where I was working, so that I see them.
21. As a client, I want my Action Step and its agreed date and time as the centre of the summary, so that I leave knowing what I agreed to.
22. As a client, I want to see whether the Check-in was written to my Goal Log, so that I trust it will be recalled next time.
23. As a client, I want to start a new Check-in from the summary and from the status menu, so that I can go again.
24. As a client, I want a light and a dark theme that follow my system until I pick one, so that the app matches my setup.
25. As a client, I want the status menu to show Brain and Voice status, so that I can tell a faked Brain or missing voice from a bug.
26. As a client who prefers reduced motion, I want the orb to hold still and show its state without animation, so that the screen does not move.
27. As a client on a narrow window, I want the stage above the transcript panel, so that nothing is cut off.
28. As a screen reader user, I want the orb hidden from assistive tech and the caption announced, so that I get the coach's words and not decoration.
29. As a keyboard user, I want every control reachable with a visible focus ring, so that I can run a Check-in without a mouse.
30. As the developer, I want the prototype switcher, fixtures and the two rejected variants gone from the main branch, so that only the chosen design ships.
31. As the developer, I want the prototype kept on a throwaway branch, so that the comparison can be reopened.

## Implementation Decisions

- **Scope is the browser UI only.** Coach Core, the relay, the Brain, the Goal Log and the voice module are untouched.
- **State stays in `App`** (ADR 0004). Every component below is presentational.
- **Coach Orb state** is derived, not stored (from the prototype):

  ```ts
  type OrbState = 'idle' | 'speaking' | 'thinking';
  const orbState = busy ? 'thinking' : speakingId != null ? 'speaking' : 'idle';
  ```

  Thinking wins over speaking. The start gate shows thinking while connecting; the summary always shows idle.
- **Coach Orb** is a new component with three sizes: stage (280px), gate (240px), mark (60px). CSS only. Layers, back to front: halo, three ripple rings, core (rotating colour swirl plus a fixed sheen), a thinking arc.
- **Halo** is a conic gradient under a radial mask, full strength at the core's edge and transparent at the rim. No blur filter, no blurred outer shadow (ADR 0005).
- **Motion timings** (from the prototype, after the user's three times slower direction): idle breathe 21s; speaking core pulse 3.3s with a 15s shape wobble; speaking halo pulse 3.6s; ripple rings 9s, staggered by 3s; thinking arc 1.3s spin. The inner colour swirl rotates at 22s idle, 9s speaking, 2.4s thinking and is not a pulse.
- **Reduced motion:** all orb animation off. Speaking is shown by static rings and a slightly off-round core; idle by a less saturated core.
- **Component set.** New: Coach Orb, and a coach stage (orb, caption, voice controls). Kept and restyled: start gate, phase stepper, transcript, message, composer, status menu, summary card. The mute toggle moves from the composer to the voice controls.
- **Check-in layout:** two columns, stage left and a fixed-width glass panel right holding transcript, error line and composer. The stepper sits top centre of the stage, the status menu top right of the stage. Below about 860px wide the columns stack, stage first, and the stage orb drops to 176px. (assumed: the prototype defines this breakpoint; it has not been looked at on a phone.)
- **Phase stepper:** pill steps with a dot each, states done, active, pending. Recall and Framing show a lead-in sentence in place of the steps; Enrollment counts as Action. Unchanged in meaning from ticket 08.
- **Caption:** the latest coach line, announced politely to assistive tech, marked while it is the line being spoken.
- **Composer:** single-line input with an icon send button, disabled while busy; send also disabled on an empty draft. (assumed: the prototype swapped the current multi-line composer for a single-line input.)
- **Tokens.** The prototype's palette is promoted from its scoped variables into the global token file, keeping the three-block theme pattern from ADR 0004. Existing token names are kept wherever a new value maps onto one; new tokens are added for the glass panel, the ambient background and the four orb colours. Light accent stays `#4B2DE2`; dark page is `#06051A`.
- **Typography:** Geist Variable, self-hosted and preloaded the way Libre Franklin is now. Libre Franklin and Fraunces are removed. Geist moves from a dev dependency to the one runtime font dependency.
- **Copy changes** (all other strings hold):
  - start gate tagline: "A check-in with the version of you a few years out."
  - summary eyebrow: "Check-in complete"; label: "Your Action Step"
  - composer placeholder: "Type your reply"
- **Prototype removal:** the variant switcher, the `variant`, `frame`, `theme` and `bar` URL parameters, the fixtures and all three variants are deleted from the main line once the real components match. The prototype is first committed to a throwaway branch and that branch named in a comment on this spec.

## Testing Decisions

- A good test here checks what a client can observe, not class names or DOM structure.
- **One seam, already pure:** the Coach Orb state derivation above, extracted as a function and unit tested with Vitest (busy wins; speaking when a line is speaking; idle otherwise). Prior art: the Coach Core flow tests.
- **No component test stack is added.** The UI has no rendered-component tests today and this spec does not introduce jsdom or a testing library. (assumed)
- **Visual review is the acceptance check for the rest**, as in ticket 08: captures of start gate, Check-in and summary in light and dark at 1440x900, plus Check-in at 390 wide and with reduced motion.
- **One live pass:** a full Check-in against the relay with voice on, confirming the orb reaches speaking and thinking from real state, since the prototype was only checked with fixture data.
- `npm run typecheck` and `npm test` stay green in every ticket.

## Out of Scope

- Speech input or any change to how the client answers.
- An orb that follows audio amplitude.
- Streaming coach replies (ticket 09 of the demo feature).
- Any change to Coaching Flow text, the Goal Log format or relay endpoints.
- A designed phone layout. Narrow widths must not break; they are not composed.

## Further Notes

- Not confirmed in the prototype: phone width, the live flow end to end, measured contrast for muted text on the glass panel in light theme. Each is an acceptance item in the tickets.
- Design references the prototype was built from (structure only): [ElevenLabs](https://mobbin.com/screens/0d07b01d-2ece-4b97-960f-ec0aad96ad69), [Mindtrip](https://mobbin.com/screens/2a51b384-1642-4e16-959d-cdfc74b09455), [Delphi](https://mobbin.com/screens/99e9fbbc-9af0-4b2c-967e-01b9df3fb4ea).

## Comments

2026-11-12: Prototype preserved on local branch `prototype/app-redesign-variants` (commit c2be511, contains `src/ui/prototype/` variants A, B, C, switcher and fixtures). Removed from the main line in ticket 04.
