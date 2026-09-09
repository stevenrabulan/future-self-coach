# 05: Voice — clone + spoken responses

**What to build:** the coach speaks. ~1-3 minutes of clean recorded audio
becomes an Instant Voice Clone of the user's own voice (requires the $6 Starter
plan; the Free plan cannot clone); the `voice_id` lives in a gitignored env
file; coach responses are spoken aloud through the relay using ElevenLabs Flash
v2.5 TTS. The demo becomes: you hear your future self talk to you.

**Blocked by:** 04 (one-screen chat UI + relay).

**Status:** ready-for-human (implemented 2026-09-06; live-verified with the
real clone)

**Implementation note (2026-09-06):** key scoping per user decision (Sep 6):
the ElevenLabs key is scoped to **Text to Speech: Access only** in the
dashboard, plus a credit cap; the clone itself is created in the dashboard
(cloning is a UI action, not an API call, so no Voices permission is
needed). Verified live end-to-end with the real clone: `GET /api/health`
reports `voice: "on"`, `POST /api/speak` returned 200 audio/mpeg (49KB,
~0.43s via the relay), and in the browser a reply after a real user
interaction auto-played in the clone with the badge cycling
`voice on → speaking… → voice on`. Audio `play()` is gated by browser
autoplay policy: after no real interaction (e.g. an automated CDP session
whose clicks are not trusted) playback is correctly rejected
(NotAllowedError); humans typing/clicking get full playback.

- [x] Voice Clone created from the user's recording; `voice_id` in gitignored
      env config
- [x] Coach responses play as audio in the browser via Flash v2.5 through the
      relay
- [x] The ElevenLabs API key never reaches the client
- [x] Latency is conversational enough for the flow (first audio chunk quickly
      after a response)
- [x] No personal audio or clone identifiers committed to the repo

## Comments

**2026-09-06 (agent, ticket 05 implemented):** Done. Voice client =
`src/voice/tts.ts` (Flash v2.5, model overridable via
`FUTURE_SELF_COACH_TTS_MODEL`; voice config all-or-nothing — a half-set
`.env` is "voice off", no crash). Relay route `POST /api/speak` streams
`audio/mpeg` straight through; key never reaches the client; 503 with
guidance when voice is unconfigured, 502 on upstream failure, 400 on blank
text. `/api/health` now reports `voice: on|off`. UI: replies auto-play
after the user's first interaction (autoplay-policy safe), Mute toggle,
▶ replay per coach line, voice badge; voice failures never break the text
flow. Hygiene: `.gitignore` covers `*.mp3/*.wav/*.m4a/*.aac/*.flac/audio/`;
`.env.example` documents the three voice vars; `docs/voice-setup.md` is the
setup runbook. 68/68 tests pass, `tsc --noEmit` clean; live fix
(f8e49ae): muting mid-playback now clears the "speaking…" indicator
(pause() doesn't fire onended).

**Setup note (user, 2026-09-06):** ElevenCreative platform chosen (not
ElevenAgents — the managed agents platform stays the documented stretch
goal, per ADR 0001 as refined). Key scoped to Text to Speech: Access only.