# 10: Change the LLM Brain to DeepSeek Flash 1017

**What to build:** a Check-in run with no model override uses "DeepSeek Flash 1017" (the user's words, 2026-11-12) on OpenRouter as the LLM Brain in place of GLM-5.3-flash. The status menu, README and code comments name the new model, and a full Check-in still reaches an Action Step.

**Blocked by:** None (can start immediately). Independent of the voice stage redesign tickets.

**Status:** needs-info

Needs from the user or a live lookup: the exact OpenRouter model id. "DeepSeek Flash 1017" has not been checked against OpenRouter's model list, so the id is not written here.

**Decisions:** changes the "which model" half of `docs/adr/0002-glm-53-flash-via-openrouter.md`. "Hosted on OpenRouter, id held in one env var" stands.

- [ ] Exact OpenRouter model id confirmed live, with current price and context size noted in a comment here
- [ ] The Brain's default model id is the new one; `FUTURE_SELF_COACH_MODEL` still overrides it
- [ ] A full Check-in against the real Brain completes: Recall or Framing, Toward, Away, Action, and an Action Step with an agreed date and time is logged to the Goal Log
- [ ] The Brain's replies still parse: no change needed to the reply contract, or the change is covered by a test
- [ ] README (architecture diagram, LLM Brain line, env var table), `.env.example` and code comments name the new model
- [ ] The glossary's LLM Brain entry no longer says "GLM-class"
- [ ] ADR 0002 is marked superseded by a new ADR recording the model change and why (reason supplied by the user)
- [ ] `npm run typecheck` and `npm test` pass
