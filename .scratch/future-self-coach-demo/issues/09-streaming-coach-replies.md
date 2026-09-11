# 09: Streaming coach replies

**What to build:** stream the coach's reply into the transcript token by token
instead of appearing whole after a pause.

**Blocked by:** none, but it touches the same UI as 08, so land 08 first.

**Status:** needs-triage

**Why it is separate:** split out of ticket 08 during the 2026-09-10 grilling
session. It is the single biggest perceived-quality win in the redesign, and
the only item in that list that is not a UI change. It changes the `BrainFn`
signature, the relay's response shape and Coach Core's turn boundary, so
bundling it into a design ticket would have turned the design ticket into a
two-day ticket.

## What it involves

- `BrainFn` gains a streaming variant (whole-response callers must keep
  working: the CLI at `src/cli/checkin.ts` and every existing test).
- The relay's `/api/brain` moves from a JSON response to SSE or a chunked
  stream, and OpenRouter's `stream: true` mode is threaded through.
- Coach Core's turn boundary: today `answer()` resolves once with a complete
  `CoachReply`, and phase advance plus Action Step capture happen on that
  resolution. Streaming means deciding whether the phase advances at first
  token or at completion.
- TTS interaction: the reply currently goes to ElevenLabs as one complete
  string once the Brain returns. Streaming text does not imply streaming audio,
  and speaking a half-finished sentence would be worse than the current
  behaviour. Decide whether TTS still waits for the full reply (probably yes).
- The typing indicator built in ticket 08 becomes redundant and should be
  removed.

## Open questions for triage

- SSE or chunked `fetch` with a `ReadableStream`?
- Does the CLI stream too, or stay whole-response?
- Does the Goal Log append still happen only at CLOSED?
