# Future Self Coach

A coach that talks to you in your own voice, as your future self.

Long-term thinking is hard to practice in the abstract. This demo makes it
concrete: you type to a coach that answers as the version of you a few years
out, and every reply is spoken aloud in a clone of your own voice. Hearing
"yourself" hold you to your commitments lands differently than text on a
screen.

The coach is not a chatbot with a persona bolted on. It runs a real coaching
conversation, the 6-Step Client Conversation Process (inspired by Eben Pagan's
coaching program, which taught it), and drives every Check-in to a commitment:
one Action Step, with an agreed date and time, enrolled and sold, not just
described.

## What a Check-in looks like

1. **Framing Questions**: the coach asks permission up front (OK to ask
   questions? OK to interrupt? OK to hold you accountable?).
2. **TOWARD**: what do you want most right now? What happens if you make it
   happen?
3. **AWAY**: what's the consequence if you don't achieve it? What happens if
   you successfully avoid that?
4. **ACTION**: what's your next step? What can you do first? When will you do
   it? The coach sells you on taking it and enrolls you in one Action Step
   with a date and time.

Each Check-in is appended to a local **Goal Log**. The next Check-in opens by
surfacing your most recent Action Step and asking about it, so the coach holds
you to your commitments over time.

## Architecture

```
┌─────────────┐     /api/*      ┌──────────────────────────────┐
│  UI (Vite + │ ──────────────► │  Relay (node:http,           │
│  React+TS)  │  same-origin    │  127.0.0.1 only)             │
│  chat       │  dev proxy      │  holds all API keys          │
└─────────────┘                 └──────┬───────────┬───────────┘
     │                                  │           │
     │  Coach Core runs client-side     ▼           ▼
     │  against the relay        OpenRouter    ElevenLabs
     ▼                           LLM Brain     Flash v2.5 TTS
┌─────────────┐                 (GLM-5.3-flash)  (your Voice Clone)
│ Coach Core  │
│ (the seam:  │        ┌──────────────────┐
│  flow +     │ reads  │ Goal Log (local, │
│  persona)   │◄───────│ append-only)     │
└─────────────┘        └──────────────────┘
```

- **Coach Core** (`src/core/`): the single testable seam. Maps (conversation
  state + Goal Log + Brain reply) to (next coach message + flow phase). Owns
  the Coaching Flow: Framing Questions, the TOWARD → AWAY → ACTION spine,
  Session Goals, and Action Step enrollment. The LLM never reorders the flow.
- **LLM Brain** (`src/brain/`): GLM-5.3-flash, hosted on OpenRouter
  (ADR 0002). The model id lives in one env var, so it is swappable. With no
  API key the app falls back to a faked Brain so the full flow runs offline.
- **Relay** (`src/relay/`): a thin local server holding every API key
  server-side. The browser talks only to the relay; OpenRouter and ElevenLabs
  are called here, never from the client. Binds to 127.0.0.1.
- **Voice** (`src/voice/`): ElevenLabs Text to Speech. The relay streams
  `audio/mpeg` straight through; the key never crosses to the browser.
- **Goal Log** (`src/log/`): local, append-only, gitignored. The committed
  `sample-goals.md` shows the shape without any real goals.
- **UI** (`src/ui/`): a one-screen chat. Phase markers are rendered inline so
  you can watch the flow move: Recall → Framing → Toward → Away → Action →
  Enrollment. Coach replies auto-play as audio after your first interaction,
  with a Mute toggle and a replay button on every coach line.

### The ElevenLabs pieces this build uses

- **Instant Voice Cloning (IVC)**: the coach's voice is a clone of the user's
  own voice, created from a short clean recording. IVC requires a paid plan
  (Starter or above; the Free plan cannot clone).
- **Flash v2.5 TTS** (`eleven_flash_v2_5`): the coach's spoken replies,
  chosen for conversational latency (~75ms to first chunk). The model is
  overridable via env var.
- **Scoped API key**: the key used by the relay is scoped to Text to Speech:
  Access only, plus a credit cap.

The managed ElevenAgents platform (real-time two-way voice, built-in memory)
is the documented stretch goal (ADR 0001); this demo is the hand-rolled
pipeline slice.

## Run it

Prerequisite: Node 22+.

```sh
npm install
npm run dev
```

That starts the relay (port 8787) and the UI together; open the printed
localhost URL. Without any `.env` the app still runs: text-only, faked Brain.
With keys in `.env` you get the real Brain and your cloned voice.

For a terminal-only Check-in (no UI, no voice):

```sh
npm run checkin
```

## Configuration

Copy `.env.example` to `.env` (gitignored) and fill in what you have:

| Variable | Purpose | Required for |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | The LLM Brain ([openrouter.ai/keys](https://openrouter.ai/keys)) | real Brain |
| `FUTURE_SELF_COACH_MODEL` | The model id. Default: `z-ai/glm-5.3-flash` | optional |
| `ELEVENLABS_API_KEY` | Text to Speech ([elevenlabs.io](https://elevenlabs.io)) | voice |
| `FUTURE_SELF_COACH_VOICE_ID` | Your Instant Voice Clone's `voice_id` | voice |
| `FUTURE_SELF_COACH_TTS_MODEL` | TTS model. Default: `eleven_flash_v2_5` | optional |
| `FUTURE_SELF_COACH_RELAY_PORT` | Relay port. Default: `8787` | optional |

Voice is all-or-nothing: with either ElevenLabs var missing, the coach runs
text-only and the header badge shows "voice off". Voice setup (recording,
cloning, key scoping) is documented in `docs/voice-setup.md`.

## Privacy

Everything personal stays out of the repo by design:

- `.env` (API keys, `voice_id`) is gitignored.
- `goals.local.md` (your real goals and Check-in history) is gitignored.
- Personal audio never enters the repo (`*.mp3`, `*.wav`, `audio/` ignored).
- The browser never sees an API key: the relay holds them server-side.

## Development

```sh
npm test        # vitest, 68 tests around the Coach Core seam and modules
npm run typecheck
```

The tests map (state + Goal Log + faked LLM response) to (next message +
phase) and assert on the flow's observable behavior: Framing Questions first,
TOWARD before AWAY before ACTION, the Action Step and date captured, and the
prior Action Step surfaced at the next Check-in. No live API, no voice.

## Attribution

The coaching flow is the user's 6-Step Client Conversation Process, inspired
by Eben Pagan's coaching program, which taught it. The user's own template is
the source of truth; this repo is an implementation of it.
