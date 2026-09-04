# 02: Real LLM Brain behind the seam

**What to build:** swap the faked LLM for the real one with zero change to
Coach Core. Typing to the coach in a terminal now produces real GLM-5.3-flash
responses (hosted via OpenRouter) that stay inside the coaching flow. The model
id is read from a single env var so it stays swappable. The demo is a real
coaching conversation, text-only, in a terminal.

**Blocked by:** 01 (Coach Core with faked LLM).

**Status:** ready-for-agent

- [ ] A terminal conversation with the coach uses GLM-5.3-flash via OpenRouter
- [ ] The model id comes from one env var; changing it changes the Brain
- [ ] API keys live only in gitignored env files
- [ ] Coach Core's tests still pass with the faked LLM (the seam did not move)
- [ ] Responses stay in the coaching flow (no freeform chat drift)