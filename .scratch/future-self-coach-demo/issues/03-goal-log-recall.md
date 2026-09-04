# 03: Goal Log + Action Step recall

**What to build:** cross-session memory. Each Check-in is appended to the local
append-only Goal Log; at the start of the next Check-in the coach surfaces the
prior Action Step (with its agreed date/time) and holds the user to it. A
committed `sample-goals.md` placeholder shows the Goal Log's shape without any
real personal data. This ticket works with either the faked or real LLM Brain.

**Blocked by:** 01 (Coach Core with faked LLM).

**Status:** ready-for-agent

- [ ] Completing a Check-in appends its outcome (including the Action Step and
      agreed date/time) to the Goal Log
- [ ] A new Check-in opens by surfacing the prior Action Step and asking about
      it
- [ ] Two consecutive Check-ins demonstrate the recall behavior end-to-end
- [ ] Real goal-log files stay gitignored; only the committed
      `sample-goals.md` placeholder is in the repo