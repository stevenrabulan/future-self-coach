# 06: README + demo recording

**What to build:** the publishable artifact. A README that explains the
concept (a coach that speaks in your cloned voice as your future self), the
architecture (Coach Core, LLM Brain via OpenRouter, relay, UI, Goal Log), and
calls out which ElevenLabs pieces the build uses (Instant Voice Cloning, Flash
v2.5 TTS), attributed as "inspired by Eben Pagan's coaching program." Plus a
screen recording of one complete Check-in. The repo becomes linkable.

**Blocked by:** 04 (one-screen chat UI + relay), 05 (voice).

**Status:** ready-for-human (README + audit done 2026-09-09; screen recording
deferred by user decision, see Comments)

- [x] README covers concept, architecture, setup (one command), and env vars
- [x] ElevenLabs platform pieces are called out explicitly
- [x] Attribution reads "inspired by Eben Pagan's coaching program"
- [ ] Screen recording of one full Check-in (including a spoken response)
      captured and linked (deferred: user records it; run-of-show below)
- [x] Repo contains no personal data (goals, keys, audio, voice id) per the
      gitignore from 01

## Comments

**2026-09-09 (agent, ticket 06 implemented):** README committed (c59eee1):
concept, architecture diagram (Coach Core / Brain / relay / UI / Goal Log),
ElevenLabs pieces section (IVC, Flash v2.5 TTS, TTS-only scoped key,
ElevenAgents as stretch goal per ADR 0001), one-command setup, env var table,
privacy section, attribution. 68/68 tests pass, `tsc --noEmit` clean.

**Privacy audit (2026-09-09, all clean):**
- Tracked files: no `.env`, no `goals.local.md` (both confirmed gitignored
  via `git check-ignore`); `sample-goals.md` is placeholder-only and
  byte-identical to the committed version.
- Full git history scan: no API keys (only the `sk_...` placeholder in
  `docs/voice-setup.md`), no audio files ever tracked, no voice id, no
  personal names/paths (git author identity is the user's own, as expected).
- Real goal text from `goals.local.md` appears nowhere in tracked files.

**Screen recording (deferred by user, 2026-09-09):** the demo recording
needs the user's voice and screen, so it stays human-run. Run-of-show when
recording (Cmd+Shift+5 or QuickTime, ~2 min):
1. Clean state: `goals.local.md` trimmed to just the Notes/empty Check-ins
   header (or kept, to demo the recall path).
2. `npm run dev`; show the terminal briefly, then the browser with the app.
3. Point at the header badges (live brain · z-ai/glm-5.3-flash, voice on).
4. Answer the Framing Questions, then one TOWARD exchange (2 turns), one
   AWAY exchange (2 turns), accept the Action Step and agree a date/time;
   the spoken reply must be audible at least once (after the first
   interaction, autoplay is allowed).
5. Let the Check-in close and show "Check-in logged to the Goal Log."
6. Optional second Check-in to show the prior Action Step being surfaced.
7. Link the recording from this README section. Note: `.gitignore` covers
   audio extensions but not video, so either host the recording externally
   and link the URL, or add `*.mp4`/`*.mov`/`docs/demo/` to `.gitignore`
   before saving it in the repo.