# 04: One-screen chat UI + relay

**What to build:** the browser experience. A single-screen chat UI (Vite +
React + TypeScript) talks to Coach Core through a thin local relay server that
holds the API keys server-side, with the Goal Log threaded in. The full text
coach runs in a browser with `npm run dev` and one command; keys never reach
the client. This is the shape the screen recording will capture.

**Blocked by:** 02 (real LLM Brain), 03 (Goal Log + Action Step recall).

**Status:** ready-for-agent

- [ ] One screen: chat with the coach, text in, transcript visible
- [ ] All API calls go through the local relay; keys are server-side only
- [ ] The coaching flow (Framing Questions, TOWARD → AWAY → ACTION, enrollment)
      is visible in the UI conversation
- [ ] The prior Action Step is surfaced in the UI at the start of a new
      Check-in
- [ ] App runs locally with one command