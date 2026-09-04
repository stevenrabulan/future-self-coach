# 02: Real LLM Brain behind the seam

**What to build:** swap the faked LLM for the real one with zero change to
Coach Core. Typing to the coach in a terminal now produces real GLM-5.3-flash
responses (hosted via OpenRouter) that stay inside the coaching flow. The model
id is read from a single env var so it stays swappable. The demo is a real
coaching conversation, text-only, in a terminal.

**Blocked by:** 01 (Coach Core with faked LLM).

**Status:** ready-for-human

- [x] A terminal conversation with the coach uses GLM-5.3-flash via OpenRouter
- [x] The model id comes from one env var; changing it changes the Brain
- [x] API keys live only in gitignored env files
- [x] Coach Core's tests still pass with the faked LLM (the seam did not move)
- [x] Responses stay in the coaching flow (no freeform chat drift)
## Comments

**2026-09-04 (agent, ticket 02 implemented):** Done. Real Brain =
`src/brain/real-brain.ts`: GLM-5.3-flash via OpenRouter's OpenAI-compatible
chat endpoint over built-in `fetch` (zero new dependencies). Seam widened
exactly as ticket 01 pre-agreed (`LlmBrain` sync-or-async); Coach Core's
logic untouched — all 16 pre-existing tests pass with await/async updates
only. `npm run checkin` now runs the real coach (`tsx
--env-file-if-exists=.env`); without a key it announces and falls back to
the faked Brain. Env: `OPENROUTER_API_KEY` (gitignored `.env`, see
`.env.example`) + `FUTURE_SELF_COACH_MODEL` (the one env var; re-read per
call so changing it changes the Brain mid-session). Verified live: full
piped Check-in ran FRAMING→TOWARD→AWAY→ACTION→ENROLL→CLOSED with the Action
Step captured and the Session Goals beats in prose; swapping the env var to
`openai/gpt-4o-mini` live changed the model; `npm test` 29/29, `tsc
--noEmit` clean. Two-axis review fixes applied: no swallowed errors in the
CLI fallback (missing-key only), no baseUrl creep, per-turn Brain
construction removed. Deferred (ticket 01 comment): Brain-negotiated
date/time as structured data — ticket 02's acceptance criteria don't
require it and it would move Coach Core's capture logic; left for the user
to schedule.
