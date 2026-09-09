# Voice setup (ticket 05)

The coach speaks its replies in a clone of your voice through ElevenLabs.
The code side is done and tested; what remains needs your voice and your
ElevenLabs account, both of which stay local (gitignored).

## What the code does

- **Relay** `POST /api/speak`: `{ text }` → streamed `audio/mpeg`. The
  ElevenLabs API key exists only inside the relay process; the browser
  receives audio bytes only.
- **TTS model**: `eleven_flash_v2_5` (default, ~75ms first chunk,
  conversational). Override with `FUTURE_SELF_COACH_TTS_MODEL`.
- **UI**: coach replies auto-play after your first interaction (browser
  autoplay rules), with a Mute toggle and a ▶ replay button on each coach
  line. Voice problems never break the text flow.
- **Voice off**: with no ElevenLabs env set, the coach runs text-only and
  the header badge shows "voice off".

## One-time setup (needs you)

1. **ElevenLabs account**: the Starter plan ($6/mo) or above — the Free
   plan cannot create Instant Voice Clones.
2. **Record ~1–3 minutes of clean audio** of your voice: quiet room, consistent
   distance from the mic, natural speaking pace, no long silences. Save as
   MP3/WAV (keep the file outside the repo or let `.gitignore` handle it —
   `*.mp3`/`*.wav`/`audio/` are ignored).
3. **Create the Instant Voice Clone**: ElevenLabs dashboard → Voices →
   Add Voice → Instant Voice Clone → upload the recording.
4. **Copy the `voice_id`** from the clone's page.
5. **Fill the gitignored `.env`** (copy from `.env.example`):

   ```
   ELEVENLABS_API_KEY=sk_...
   FUTURE_SELF_COACH_VOICE_ID=...
   ```

6. **Verify**: `npm run dev` → the header badge shows "voice on" → send a
   message → the reply plays aloud in your cloned voice.

## Privacy invariants

- The API key and `voice_id` live only in the gitignored `.env`.
- Personal audio never enters the repo (gitignored extensions + `audio/`).
- The client never sees the key: `/api/speak` proxies server-side only.
- `git check-ignore` any file you are unsure about before committing.
