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

**Status:** ready-for-agent

- [ ] Framing Questions are asked before any flow content
- [ ] TOWARD questions come before AWAY, AWAY before ACTION, in order
- [ ] An Action Step (with agreed date/time) is captured at ACTION
- [ ] The coach sells/enrolls the user on the Action Step rather than only
      describing it
- [ ] Coach Core is tested through a single seam with a faked LLM (canned
      responses), no network access in tests
- [ ] `.gitignore` ignores env files and local (real) goal-log files
- [ ] A tiny terminal/CLI loop can run a full Check-in against the faked LLM