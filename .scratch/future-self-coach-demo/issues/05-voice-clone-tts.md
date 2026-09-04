# 05: Voice — clone + spoken responses

**What to build:** the coach speaks. ~1-3 minutes of clean recorded audio
becomes an Instant Voice Clone of the user's own voice (requires the $6 Starter
plan; the Free plan cannot clone); the `voice_id` lives in a gitignored env
file; coach responses are spoken aloud through the relay using ElevenLabs Flash
v2.5 TTS. The demo becomes: you hear your future self talk to you.

**Blocked by:** 04 (one-screen chat UI + relay).

**Status:** ready-for-agent

- [ ] Voice Clone created from the user's recording; `voice_id` in gitignored
      env config
- [ ] Coach responses play as audio in the browser via Flash v2.5 through the
      relay
- [ ] The ElevenLabs API key never reaches the client
- [ ] Latency is conversational enough for the flow (first audio chunk quickly
      after a response)
- [ ] No personal audio or clone identifiers committed to the repo