/**
 * Tests for the ElevenLabs TTS client (ticket 05). The network leg is
 * stubbed, per spec: "network legs may be stubbed". What is pinned here:
 * the env contract (key + voice id, gitignored), the request shape
 * (Flash v2.5 model id, xi-api-key header), and fail-loud error mapping.
 */
import { describe, expect, it, vi } from 'vitest';
import { createTtsClient, readTtsConfigFromEnv } from './tts.js';

describe('readTtsConfigFromEnv', () => {
  it('returns null when no API key is set (voice stays off, no crash)', () => {
    expect(readTtsConfigFromEnv({})).toBeNull();
  });

  it('returns null when the key is set but the voice id is missing', () => {
    expect(readTtsConfigFromEnv({ ELEVENLABS_API_KEY: 'k' })).toBeNull();
  });

  it('reads key and voice id; defaults the model to eleven_flash_v2_5', () => {
    const cfg = readTtsConfigFromEnv({
      ELEVENLABS_API_KEY: ' k ',
      FUTURE_SELF_COACH_VOICE_ID: ' v ',
    });
    expect(cfg).toEqual({
      apiKey: 'k',
      voiceId: 'v',
      modelId: 'eleven_flash_v2_5',
    });
  });

  it('honors the model override env var', () => {
    const cfg = readTtsConfigFromEnv({
      ELEVENLABS_API_KEY: 'k',
      FUTURE_SELF_COACH_VOICE_ID: 'v',
      FUTURE_SELF_COACH_TTS_MODEL: 'eleven_turbo_v2_5',
    });
    expect(cfg?.modelId).toBe('eleven_turbo_v2_5');
  });
});

describe('createTtsClient', () => {
  it('rejects an empty voice id at construction (fail fast)', () => {
    expect(() =>
      createTtsClient({ apiKey: 'k', voiceId: '  ', modelId: 'eleven_flash_v2_5' }),
    ).toThrow(/voice id/i);
  });

  it('POSTs the text to ElevenLabs with the xi-api-key header and Flash model id', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(new Uint8Array([1, 2, 3]).buffer, { status: 200 }),
    );
    const speak = createTtsClient({
      apiKey: 'secret-key',
      voiceId: 'voice-123',
      modelId: 'eleven_flash_v2_5',
      fetchFn: fetchMock as unknown as typeof fetch,
    });
    await speak('Hello from your future self.');
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { method: string; headers: Record<string, string>; body: string },
    ];
    expect(url).toBe('https://api.elevenlabs.io/v1/text-to-speech/voice-123');
    expect(init.method).toBe('POST');
    expect(init.headers['xi-api-key']).toBe('secret-key');
    const body = JSON.parse(init.body) as { text: string; model_id: string };
    expect(body.text).toBe('Hello from your future self.');
    expect(body.model_id).toBe('eleven_flash_v2_5');
  });

  it('returns the upstream body untouched (the relay streams it)', async () => {
    const audio = new Uint8Array([9, 8, 7]).buffer;
    const fetchMock = vi.fn(async () => new Response(audio, { status: 200 }));
    const speak = createTtsClient({
      apiKey: 'k',
      voiceId: 'v',
      modelId: 'eleven_flash_v2_5',
      fetchFn: fetchMock as unknown as typeof fetch,
    });
    const res = await speak('hi');
    expect(res.ok).toBe(true);
    expect(await res.arrayBuffer()).toEqual(audio);
  });

  it('maps an upstream failure to a loud error that includes the status', async () => {
    const fetchMock = vi.fn(async () => new Response('bad voice id', { status: 401 }));
    const speak = createTtsClient({
      apiKey: 'k',
      voiceId: 'v',
      modelId: 'eleven_flash_v2_5',
      fetchFn: fetchMock as unknown as typeof fetch,
    });
    await expect(speak('hi')).rejects.toThrow(/HTTP 401/);
  });

  it('rejects blank text before any network call', async () => {
    const fetchMock = vi.fn();
    const speak = createTtsClient({
      apiKey: 'k',
      voiceId: 'v',
      modelId: 'eleven_flash_v2_5',
      fetchFn: fetchMock as unknown as typeof fetch,
    });
    await expect(speak('   ')).rejects.toThrow(/text/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
