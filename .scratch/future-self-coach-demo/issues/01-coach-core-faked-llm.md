# 01: Coach Core with faked LLM

**What to build:** the coaching conversation itself, as pure logic. The Coach
Core module maps (conversation state + Goal Log + LLM response) → next coach
message + current flow phase. It opens every Check-in with the Framing
Questions, then drives the coaching flow spine TOWARD → AWAY → ACTION, aiming
each Check-in at the Session Goals (1 aha moment, 1 moment of emotional
inspiration, 1 Action Step the user is enrolled in with an agreed date/time).
This ticket has no live API, no voice, and no UI: the LLM Brain is faked with
canned responses, and the whole flow is provable from a terminal or test run.
Repo hygiene lands here too: a `.gitignore` covering env files and any local
goal-log files, so real goals and keys can never be committed later.

**Blocked by:** None (can start immediately).

**Status:** ready-for-human

- [x] Framing Questions are asked before any flow content
- [x] TOWARD questions come before AWAY, AWAY before ACTION, in order
- [x] An Action Step (with agreed date/time) is captured at ACTION
- [x] The coach sells/enrolls the user on the Action Step rather than only
      describing it
- [x] Coach Core is tested through a single seam with a faked LLM (canned
      responses), no network access in tests
- [x] `.gitignore` ignores env files and local (real) goal-log files
- [x] A tiny terminal/CLI loop can run a full Check-in against the faked LLM

## Comments

**2026-09-04 (agent, ticket 01 implemented):** Done. Stack: TypeScript +
Vitest (`npm test`, 12 passing, `tsc --noEmit` strict clean). Layout:
`src/core/` (types, flow-text, coach — the Coach Core seam), `src/brain/fake-brain.ts`
(canned Brain), `src/cli/checkin.ts` (`npm run checkin`, works interactive and
piped). Seam shape: Coach Core owns phase + exact flow question; the Brain
returns prose for that question (`BrainInput`). Verified via a piped
Check-in: Framing recall → TOWARD → AWAY → ACTION → sell with captured
Action Step → decline re-asks the date/time → re-agree → CLOSED.

Deferred findings from two-axis code review (standards + spec):

- **Session Goals: aha + inspiration legs not built.** Ticket text names all
  three Session Goals; only the Action Step leg is implemented. The flow
  spine has no step that pursues an aha moment or emotional inspiration.
  Needs a decision: fold into the Brain's prose (ticket 02, prompt-level per
  ADR 0003) or add explicit flow steps. Flagged rather than silently dropped.
- **Goal Log persistence is not in this ticket** (only recall from an
  injected `GoalLog` object; the CLI uses a hardcoded sample). Matches
  ticket 03's scope; noted here so the seam's Goal Log half is not assumed
  proven end-to-end.
- **Framing consent is not enforced** — a non-consenting answer still
  advances to TOWARD. Demo-acceptable; revisit if the demo recording shows a
  user answering "no".
- **Date/time capture is demo-grade regex** (clock time preferred over day
  words; `when` is raw matched text like `9am`). Ticket 02's real Brain
  should negotiate the date/time in prose and return structured data.
- Dead code and duplicated-code stubs flagged by review were fixed in this
  pass; a shared test Brain stub is deliberately NOT extracted yet (two
  stubs model different BrainInput behaviors; extract when ticket 02's real
  Brain shows the shared shape).
