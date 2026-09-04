# 04: One-screen chat UI + relay

**What to build:** the browser experience. A single-screen chat UI (Vite +
React + TypeScript) talks to Coach Core through a thin local relay server that
holds the API keys server-side, with the Goal Log threaded in. The full text
coach runs in a browser with `npm run dev` and one command; keys never reach
the client. This is the shape the screen recording will capture.

**Blocked by:** 02 (real LLM Brain), 03 (Goal Log + Action Step recall).

**Status:** ready-for-human (implemented 2026-09-04; pending review)

**Implementation note (2026-09-04):** the relay loads the Goal Log itself on
every request instead of accepting a client-supplied copy; the UI posts only
the BrainInput Coach Core produces. Keys stay server-side; the browser talks
only to same-origin `/api/*`, which the Vite dev proxy forwards to the relay
on 127.0.0.1:8787. Verified end-to-end in a real browser: full Check-in
against GLM-5.3-flash, all phases in order, Goal Log appended, prior Action
Step surfaced via RECALL on the next load.

- [x] One screen: chat with the coach, text in, transcript visible
- [x] All API calls go through the local relay; keys are server-side only
- [x] The coaching flow (Framing Questions, TOWARD → AWAY → ACTION, enrollment)
      is visible in the UI conversation
- [x] The prior Action Step is surfaced in the UI at the start of a new
      Check-in
- [x] App runs locally with one command (`npm run dev`)

## Comments

**2026-09-04 (agent, ticket 04 implemented):** Done. Relay =
zero-dep `node:http` (`src/relay/server.ts`, 8 tests); UI = Vite + React 19 +
TS (`src/ui/`), reusing Coach Core client-side. One command:
`npm run dev` (concurrently: relay + Vite with `/api` proxy). Deps pinned to
vite@7 + @vitejs/plugin-react@5 (latest plugin-react needs vite 8, conflicts
with vitest's vite peer range). One bug found and fixed during the live
browser drive: the relay originally expected a client-wrapped
`{ input, goalLog }` body; the UI sent bare BrainInput. Resolution: the relay
now owns the Goal Log and loads it per request.