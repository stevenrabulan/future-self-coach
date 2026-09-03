# Guided Coaching Flow over freeform chat

ASSUMED at 2026-09-02 (silent consent; the framework and the *cross-session
append-log* are the user's / an assumed default — either can still be vetoed).

Context: the coach can be built as freeform chat or as a guided flow. The user
supplied the actual flow they use (their 6-Step Client Conversation Process,
inspired by Eben Pagan's coaching program, which taught it). The decision is to
run *that* flow.

Decision: run the **6-Step process** per Check-in, spine **TOWARD → AWAY →
ACTION**: open with the **Framing Questions**, drive to the **Session Goals** (1
aha moment, 1 moment of emotional inspiration, 1 **Action Step**), and enroll the
client in that Action Step with an agreed date/time. Cross-session memory is a
lightweight per-check-in append log the coach reads at the start of the next
Check-in, so a prior Action Step can be recalled.

Rationale: persona-only "sounds like a future self" but demonstrably does
nothing; a fixed, proven flow is provable in a session and is what makes the
demo *show* long-term thinking. The coach **recommends the action and enrolls the
client on it** — this is the pitch, so the demo must be able to *sell and
commit*, not stay in abstract chat. Freeform chat is the rejected alternative
(under-delivers on the pitch). The flow is enforced via the system prompt on
GLM-5.3-flash; recall is the appended log fed back in. ElevenAgents (knowledge
base + personalization + multi-turn memory) carries it; a hand-rolled slice
reduces it to the prompt + an append file.

Consequences: the UI must present the flow + aha + Action Step legibly; check-in
scheduling starts record-only (stretch: real calendar/reminder). This is a
prompt-level decision, cheap to revise — recorded for "why this flow," not
lock-in.

Note: attribution is "inspired by Eben Pagan," the flow being from his coaching
program, not a public source. The user's template (6-step process, Toward/Away/
Action sub-questions) is the source of truth; this ADR summarizes its spine.
