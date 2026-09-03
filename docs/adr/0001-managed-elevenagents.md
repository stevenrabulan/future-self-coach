# Managed ElevenAgents over a hand-rolled pipeline

ASSUMED at 2026-09-02 (silent consent; not yet explicitly confirmed by the user,
who can still veto).

Context: the demo can be built two ways — on ElevenLabs' **managed Conversational
AI / ElevenAgents** platform, or as a **hand-rolled** browser-mic → Scribe STT →
LLM → Flash-v2.5 TTS pipeline.

Decision: use **managed ElevenAgents** (their Conversational AI platform).

Rationale: the demo should exercise as much of the ElevenLabs platform as
practical. Managed ElevenAgents uses three ElevenLabs pillars at once — voice cloning,
TTS (Flash), and the conversational agent loop — and bundles the knowledge base
and personalization the "future self" needs. A hand-rolled pipeline is more
flexible and cheaper per-call but shows *less* of their platform. That trade-off
is the deciding factor and it is hard to reverse cleanly once the UI is built
around one platform's API, hence an ADR. Fallback: hand-roll only if scope or
time forces it.
