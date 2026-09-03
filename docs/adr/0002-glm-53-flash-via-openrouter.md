# GLM-5.3-flash via OpenRouter as the LLM

ASSUMED at 2026-09-02 (silent consent; not yet explicitly confirmed by the user,
who can still veto).

Context: the user proposed "GLM 5.3 flash." Verified live: `z-ai/glm-5.3-flash`
is available on OpenRouter (OpenAI-compatible), ~$0.0001/call at the 50% promo
through 2026-09-09 (list $0.15/$0.50), 1M context, ~1/10 the cost of the user's
`z-ai/glm-5.2` default, and its ~328GB fp8 weights do not fit the M4 Pro, so it
must be hosted, not local.

Decision: **GLM-5.3-flash hosted on OpenRouter**, injected into ElevenLabs
ElevenAgents' custom-LLM slot; the model id held in one env var so it is
swappable.

Rationale: it is the real model the user named, effectively free for a demo, and
it is the "brain" not the showcase. Keeping it behind an env var is cheap to
reverse; the decision recorded here is *which* model and *hosted not local*
(surprising: the user's other GLM work is local). ElevenLabs-hosted LLM is the
rejected alternative — simpler but exposes fewer of ElevenLabs' own integration
points, which is the point of the demo.

Note: promo window — verify current pricing before building past 2026-09-09.
