# 07: Framing Questions as a numbered list + remembered acceptance

**What to build:** two changes to the Framing Questions.

1. **Numbered list.** The Framing Questions render as an ordered list under a
   lead-in ("Hey, is it ok if I:"), not one run-on line. The UI already sets
   `white-space: pre-wrap` on coach lines, so plain-text newlines render
   as-is; no markdown renderer is needed.
2. **Remembered acceptance.** When the client accepts ("yes", "sure", "yea",
   etc.), record that in the Goal Log. At the start of a later Check-in, if
   acceptance is already on record, the coach does not re-ask: it gives a
   short reminder that lists the same items and ends "As we agreed."

**Blocked by:** nothing (01-05 are done).

**Status:** ready-for-human (implemented 2026-09-09; see Comments)

## Decisions (user, 2026-09-09)

- **Storage:** a new `## Framing` section in the Goal Log, parsed into
  `GoalLog.framingAcceptedOn`. Reuses the existing parse/append pipeline and
  gitignore, keeps one cross-session source of truth. Rejected: `## Notes`
  (free-form goal prose fed to the Brain, would mix state into context) and a
  separate `framing.local.json` (second store, can drift).
- **Non-acceptance:** advance anyway, do not persist. Current behavior is
  unchanged (any answer moves FRAMING to TOWARD); only a clear yes is saved,
  so a non-accept just means the question is asked again next session.
  Rejected: re-asking (new loop state) and ending the Check-in (a stray "no"
  dead-ends the demo with no Action Step to log).

## Acceptance criteria

- [x] `FRAMING_QUESTIONS` renders as a lead-in plus `1.`-`4.` on their own
      lines, wording otherwise unchanged from CONTEXT.md
- [x] The four items still read as the CONTEXT.md Framing Questions (ask
      questions / interrupt to keep us on track / make requests / hold
      yourself accountable)
- [x] A clear acceptance at FRAMING is detected and recorded
- [x] An ambiguous or negative answer is not recorded, and the flow advances
      to TOWARD exactly as before
- [x] With acceptance on record, a later Check-in shows the reminder (same
      items, ending "As we agreed.") instead of the questions
- [x] The framing block reaches the client verbatim, never as a Brain flow
      question (the persona forbids lists and the drift check normalizes
      whitespace, so a flattened list would pass unnoticed)
- [x] Goal Log round-trips the `## Framing` section; a log without the
      section parses as not-yet-accepted (back-compat with existing files)
- [x] `npm test` and `tsc --noEmit` clean

## Comments

**2026-09-09 (agent, implemented):** 101/101 tests pass, `tsc --noEmit` clean.

Changes:
- `src/core/flow-text.ts`: `FRAMING_ITEMS` is the single source of the four
  permissions; `FRAMING_QUESTIONS` and `FRAMING_REMINDER` render it as a
  numbered list with and without the question marks, so the two can't drift.
- `src/core/coach.ts`: `isFramingAcceptance()` (DECLINE_RE checked first, so
  "no, not really" never reads as a yes); the coach picks questions vs
  reminder from `goalLog.framingAcceptedOn`; `state()` exposes
  `framingAccepted`.
- `src/log/goal-log.ts`: parses and writes a `## Framing` section;
  `withFramingAcceptance()` is idempotent, so the date stays the original.
- `CONTEXT.md` glossary and `sample-goals.md` updated to match.

**Design note worth keeping:** on a repeat Check-in the framing text used to
go through the Brain as its flow question. That path was unsafe for a list:
the Coach Persona says "no lists, no headers", and `replyCarriesQuestion()`
normalizes whitespace, so a model that flattened the numbering onto one line
would still pass the drift check and ship a broken list. Coach Core now asks
the Brain only for the recall acknowledgement and appends the framing block
verbatim. Two regression tests pin this (no `question` reaches the Brain; the
recorded turn matches what was shown).

**Not verified live:** a full browser Check-in through to acceptance was not
run, because it appends to the real `goals.local.md` and spends OpenRouter +
ElevenLabs credits. Verified instead by a scripted two-Check-in run against
the faked Brain (first asks, appends `## Framing`, second reminds) and by
screenshotting the opening list in the running UI.
