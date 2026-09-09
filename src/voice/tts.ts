/**
 * ElevenLabs TTS client (ticket 05): turns one coach message into spoken
 * audio using the user's Instant Voice Clone. Flash v2.5 for conversational
 * latency (~75ms first chunk). The API key never leaves the relay process:
 * this module runs server-side only, and the relay streams the audio bytes
 * to the browser.
 *
 * Env (gitignored .env, see .env.example):
 *   ELEVENLABS_API_KEY             — required for voice
 *   FUTURE_SELF_COACH_VOICE_ID     — the Instant Voice Clone's voice_id
 *   FUTURE_SELF_COACH_TTS_MODEL    — optional model override
 *                                    (default: eleven_flash_v2_5)
 */
export interface TtsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
}

const DEFAULT_TTS_MODEL = 'eleven_flash_v2_5';
const ELEVENLABS_TTS_URL = (voiceId: string): string =>
  `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;

/**
 * Reads the voice config from env. Returns null (not a throw) when voice is
 * not configured: the coach must run text-only without crashing. A set but
 * half-filled config is also null — voice is all-or-nothing.
 */
export function readTtsConfigFromEnv(env: NodeJS.ProcessEnv = process.env): TtsConfig | null {
  const apiKey = env.ELEVENLABS_API_KEY?.trim() ?? '';
  const voiceId = env.FUTURE_SELF_COACH_VOICE_ID?.trim() ?? '';
  if (apiKey === '' || voiceId === '') return null;
  const modelId = env.FUTURE_SELF_COACH_TTS_MODEL?.trim() || DEFAULT_TTS_MODEL;
  return { apiKey, voiceId, modelId };
}

export interface CreateTtsClientArgs extends TtsConfig {
  /** Fetch override for tests; defaults to the global. */
  fetchFn?: typeof fetch;
}

/**
 * One coach message → one audio Response (mpeg). The relay streams this
 * body through; the client never sees the key. Validates inputs loudly
 * before any network call.
 */
export function createTtsClient(
  args: CreateTtsClientArgs,
): (text: string) => Promise<Response> {
  const { apiKey, voiceId, modelId, fetchFn } = args;
  if (apiKey.trim() === '') {
    throw new Error('createTtsClient: ELEVENLABS_API_KEY is required (gitignored .env, never committed)');
  }
  if (voiceId.trim() === '') {
    throw new Error('createTtsClient: voice id is required (FUTURE_SELF_COACH_VOICE_ID in gitignored .env)');
  }

  const doFetch = fetchFn ?? fetch;

  return async (text: string): Promise<Response> => {
    const trimmed = text.trim();
    if (trimmed === '') {
      throw new Error('createTtsClient: text must be a non-empty string');
    }
    let response: Response;
    try {
      response = await doFetch(ELEVENLABS_TTS_URL(voiceId), {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'content-type': 'application/json',
          accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: trimmed,
          model_id: modelId,
          output_format: 'mp3_44100_128',
        }),
      });
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`TTS: ElevenLabs request failed: ${reason}`);
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(
        `TTS: ElevenLabs request failed: HTTP ${response.status}${detail !== '' ? `: ${detail.slice(0, 300)}` : ''}`,
      );
    }
    return response;
  };
}
