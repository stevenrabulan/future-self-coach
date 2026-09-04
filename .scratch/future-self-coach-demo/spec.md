---
Status: ready-for-agent
Feature: future-self-coach-demo
---

# Spec: Future-Self Coach demo

## Problem Statement

Steve wants a coach that speaks in his own cloned voice and advises as his
future self: long-term thinking is hard to practice in the abstract, and
hearing it from a version of himself a few years out makes it concrete. The
project exists to prove that concept end-to-end with a working demo.

## Solution

A one-screen web app, the **Future Self Coach**: the user types to a coach that
speaks back in a clone of the user's own voice, advising from the persona of
the user's future self. The LLM behind the coach's responses is GLM-5.3-flash
(hosted, via OpenRouter); the voice is an ElevenLabs Instant Voice Clone; the
conversation runs the user's **coaching flow** (their 6-Step Client Conversation
Process, inspired by Eben Pagan's coaching program, which taught it: Framing
Questions, then TOWARD → AWAY → ACTION, enrolling the user in one **Action
Step** with an agreed date/time). A stretch goal carries this to managed
ElevenAgents with real-time two-way voice.

## User Stories

1. As Steve, I want a working web app demo, so that the concept shows rather
   than claims.
2. As Steve, I want to record ~1-3 minutes of clean audio and get an Instant
   Voice Clone of my own voice, so that the coach speaks as me.
3. As Steve, I want the coach to speak its responses aloud in my cloned voice,
   so that hearing "my future self" is visceral, not just text on a screen.
4. As Steve, I want the coach driven by GLM-5.3-flash, so that responses are
   cheap and the model id is swappable via one env var.
5. As Steve, I want the coach persona to be my compassionate but demanding
   future self, so that the advice lands as long-term thinking, not a chatbot.
6. As Steve, I want the coach to open each Check-in with the Framing Questions,
   so that the conversation has a coaching contract before it dives in.
7. As Steve, I want the coach to run TOWARD ("what do you want most right now?"
   / "what happens if you make it happen?"), then AWAY ("what's the consequence
   if you don't achieve it?" / "what happens if you successfully avoid that?"),
   then ACTION ("what's your next step? what can you do first? when can you do
   it, will you agree to do it at [date/time]?"), so that a session produces a
   real action step, not just reflection.
8. As Steve, I want the coach to drive each Check-in to the Session Goals — one
   aha moment, one moment of emotional inspiration, one action step — so that
   every session has a demonstrable payoff.
9. As Steve, I want the coach to enroll me in the Action Step (sell me on
   taking it), so that the session ends in commitment, not description.
10. As Steve, I want my prior Action Step surfaced at the start of the next
    Check-in, so that the coach holds me to my commitments over time.
11. As Steve, I want each Check-in appended to a local Goal Log, so that the
    coach can reference my history and the demo can show a two-check-in thread.
12. As Steve, I want my real goals and API keys kept out of the public repo
    (gitignored `.env` and a local goals file), so that I can share the link
    without leaking personal data.
13. As Steve, I want the repo to ship a `sample-goals.md` placeholder, so that
    a reader can see the Goal Log's shape without seeing my goals.
14. As Steve, I want the architecture and flow documented in a README with the
    ElevenLabs pieces called out, so that a reader sees which ElevenLabs pieces
    the architecture uses.
15. As Steve, I want the app to run locally with one command, so that I can
    record the demo screen-recording without setup friction.
16. As Steve, I want a screen recording of one Check-in, so that the
    project ships with proof it works.
17. As Steve, I want the goal-log pipeline behind one seam, so that I can test
    the coaching flow with a faked LLM and no live API.

## Implementation Decisions

- **ADR 0001** (assumed, vetoable): *slice-first* — the demo is a hand-rolled
  pipeline (text in → GLM-5.3-flash → ElevenLabs Flash v2.5 TTS in the cloned
  voice), not managed ElevenAgents; managed ElevenAgents with real-time two-way
  voice is the documented stretch goal. *(Note: ADR 0001's title says "managed
  ElevenAgents over a hand-rolled pipeline" — it records the original
  assumed-before-grilling answer; the later grilling rounds (Q6/Q11) refined
  this to slice-first. The ADR should be updated to record the refinement,
  not silently contradicted.)*
- **ADR 0002**: LLM Brain = GLM-5.3-flash hosted on OpenRouter
  (`z-ai/glm-5.3-flash`), model id in one env var; hosted, not local (328GB
  fp8 weights don't fit the M4 Pro). Rejected: ElevenLabs-hosted LLM.
- **Modules** (per ADR 0001 as refined):
  - `Coach Core`: conversational logic — maps (conversation state + Goal Log +
    prior Action Steps) → next coach message + current flow phase. Holds the
    coaching flow, persona, Framing Questions, TOWARD/AWAY/ACTION spine, and
    enrollment of the user in the Action Step. The single testable seam.
  - **Relay**: thin local server holding API keys; browser → relay →
    OpenRouter + ElevenLabs. Keys never reach the client.
  - **UI**: one-screen Vite + React + TypeScript chat UI; text in, audio out.
  - **Goal Log**: local, append-only, gitignored (real) + committed sample.
- **Stack**: Vite + React + TypeScript; small Node relay (keys server-side).
- **Voice pipeline**: ElevenLabs IVC (needs the $6 Starter plan; Free cannot
  clone) → `voice_id` in `.env`; TTS = `eleven_flash_v2_5` (~75ms first chunk,
  conversational).
- **Privacy**: real goals + keys in gitignored `.env` / `goals.local.md`;
  committed `sample-goals.md` shows the Goal Log's shape only.
- **Attribution**: "inspired by Eben Pagan's coaching program" in README and
  persona; the user's own 6-step template is the source of truth for the flow.

## Testing Decisions

- **One seam**: `Coach Core`. Tests map (state + goal log + faked LLM response)
  → (next message + phase), asserting on the coaching flow's observable
  behavior: Framing Questions asked first, TOWARD before AWAY before ACTION,
  Action Step + date/time captured at ACTION, prior Action Step surfaced at the
  next Check-in. Faked LLM = canned responses, no live API, no voice.
- **Smoke test**: the `clone → GLM → TTS` pipeline produces a playable audio
  artifact; network legs may be stubbed.
- UI, relay, and API clients are thin wrappers; covered by the smoke test, no
  dedicated tests.

## Out of Scope

- Managed ElevenAgents deployment (stretch goal, documented, not built for the
  demo).
- Real-time two-way voice (mic in), calendar/reminder integration for
  check-ins, multi-user support, production hosting (the app runs locally).
- Production-grade memory (the Goal Log is a flat append-only local file).

## Further Notes

- Grilling Q11/Q12/Q13 settled by silent consent and confirmed by the user;
  ADR 0001 was amended 2026-09-04 to record the slice-first refinement
  (superseded-in-part note at the top).
- Model note for the implementer: the spec was written on
  `z-ai/glm-5.3-flash` (OpenRouter) as the active runtime model.
- Repo: `~/Developer/sr/ideas/future-self-coach`, git initialized (85c4af4),
  local-markdown tracker under `.scratch/`, label `ready-for-agent` applied
  via the `Status:` line. No GitHub remote yet; push later when the user asks.
