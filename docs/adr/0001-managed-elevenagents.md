# Managed ElevenAgents over a hand-rolled pipeline

SUPERSEDED IN PART at 2026-09-04 by the grilling refinement (Q6/Q11, confirmed
by the user): the demo SLICE is hand-rolled; managed ElevenAgents remains the
stretch goal. Originally ASSUMED 2026-09-02 (silent consent).

Context: the demo can be built two ways — on ElevenLabs' **managed Conversational
AI / ElevenAgents** platform, or as a **hand-rolled** pipeline (text in →
GLM-5.3-flash → Flash-v2.5 TTS in the cloned voice; mic-in/STT in the stretch).

Decision (original, 2026-09-02): use **managed ElevenAgents**.

Decision (refined, 2026-09-04, user-confirmed): the **demo slice is hand-rolled**
— a one-screen React UI, text in → GLM-5.3-flash → Flash v2.5 in the cloned
voice out — because it is the fastest credible vertical slice for a 1-day
scope. **Managed ElevenAgents with real-time two-way voice is the documented
stretch goal**, and remains the target that shows the most of the platform.

Rationale: the demo should exercise as much of the ElevenLabs platform as
practical. Managed ElevenAgents uses three ElevenLabs pillars at once — voice cloning,
TTS (Flash), and the conversational agent loop — and bundles the knowledge base
and personalization the "future self" needs. But the demo slice needs to
exist fast, and the slice already demonstrates two pillars (cloning + Flash TTS)
plus a bring-your-own LLM. Trade-off recorded because the platform choice is
hard to reverse once the UI is built around one platform's API.
