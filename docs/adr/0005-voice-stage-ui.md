# Voice stage UI: the Coach Orb leads, the transcript is secondary

Status: accepted (2026-11-12)

Context: the ticket 08 screen is a chat transcript, which hides the product's
mechanism: a coach that speaks in the user's Voice Clone. Three coded
prototypes of the whole app were compared on the real route. Decision: the
**voice stage** layout. A Coach Orb with the coach's latest line as a caption
takes the centre of the Check-in screen, and the transcript and composer move
to a side panel. The look changes with it: Geist replaces Libre Franklin, and
a violet-tinted palette with an ambient gradient background replaces the
neutral one.

Supersedes the design-language choices recorded in ADR 0004 (Libre Franklin,
the neutral palette, "speaking pulse is an opacity breathe"). ADR 0004's
styling decision (CSS Modules, native CSS, tokens outside the modules, state in
`App`) stands.

## Considered options

- **One question at a time** (prototype A): only the coach's latest question,
  large and centred, on the existing tokens. Rejected: earlier turns sit behind
  a drawer, and nothing on screen says the coach is speaking.
- **Transcript with side rail** (prototype C): the transcript kept, with the
  Toward, Away, Action outline in a left rail and a serif editorial look.
  Rejected: still a reading surface first.
- **Voice stage** (prototype B): chosen by the user after review (2026-11-12).

## Consequences

- **The Coach Orb is CSS only.** Gradients, masks and keyframes, no canvas,
  WebGL or animation library. It shows three states (idle, speaking, thinking)
  taken from state `App` already owns. It does not follow audio amplitude, so
  no Web Audio analyser sits on the shared audio element.
- **The halo is a radial fade, not a blur.** The glow behind the orb is a
  masked gradient that is full strength at the orb's edge and transparent at
  its rim, with no `filter: blur` and no blurred outer shadow. User direction
  (2026-11-12); do not "restore" the blur.
- **Slow pulse.** Idle breathe 21s, speaking pulse about 3.5s, ripple rings 9s.
  User direction (2026-11-12) after the first prototype pulsed three times
  faster.
- **Font dependency swaps, count stays at one.** `@fontsource-variable/geist`
  replaces `@fontsource-variable/libre-franklin`, self-hosted and preloaded the
  same way.
- **The mute toggle leaves the Composer.** Voice controls (mute, replay) sit
  under the orb, because they act on the voice, not on the typed reply.
- **Typed input stays.** The stage is a presentation of the same typed
  Check-in. Speech input is not part of this decision.

Assumption record: the user explicitly chose the voice stage, the three times
slower pulse and the unblurred halo. The CSS-only orb, the three-state model,
the Geist swap in place of Libre Franklin (it came with the chosen prototype),
the voice controls moving under the orb, and the term "Coach Orb" were
**assumed under silent consent** and can still be vetoed.
