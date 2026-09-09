/**
 * Tests for the relay (ticket 04): the endpoints work, bad input fails
 * loudly, and keys stay server-side (the relay proxies to OpenRouter; the
 * client never sees a key). The OpenRouter leg is stubbed, per spec:
 * "network legs may be stubbed".
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRelayHandler } from './server.js';
import type { BrainInput } from '../core/types.js';

/** A minimal valid BrainInput: the seam Coach Core produces. */
const input: BrainInput = {
  state: { turns: [], phase: 'FRAMING' },
  question: 'OK to ask questions?',
};

type Handler = ReturnType<typeof createRelayHandler>;
type Req = Parameters<Handler>[0];
type Res = Parameters<Handler>[1];

/** Dispatches one request through the handler; returns status + parsed body. */
async function call(
  method: string,
  path: string,
  body?: unknown,
  env?: Record<string, string>,
): Promise<{ status: number; json: unknown }> {
  const chunks: Buffer[] = body == null ? [] : [Buffer.from(JSON.stringify(body), 'utf8')];
  const req = {
    method,
    url: path,
    [Symbol.asyncIterator]: async function* () {
      while (chunks.length > 0) {
        const c = chunks.shift();
        if (c != null) yield c;
      }
    },
  } as unknown as Req;
  let status = 0;
  const rawParts: Array<string | Uint8Array> = [];
  const res = {
    writeHead: (s: number) => {
      status = s;
    },
    write: (p: string | Uint8Array) => {
      rawParts.push(p);
    },
    end: (p?: string | Uint8Array) => {
      if (p != null) rawParts.push(p);
    },
  } as unknown as Res;
  const handler = createRelayHandler();
  await handler(req, res);
  const isBinary = rawParts.some((p) => typeof p !== 'string');
  const raw = isBinary
    ? Buffer.concat(rawParts.map((p) => (typeof p === 'string' ? Buffer.from(p, 'utf8') : Buffer.from(p))))
    : rawParts.join('');
  return { status, json: isBinary ? null : (JSON.parse(String(raw) || 'null') as unknown) };
}

describe('relay handler', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('GET /api/health reports faked brain when no API key is set', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const { status, json } = await call('GET', '/api/health');
    expect(status).toBe(200);
    expect(json).toMatchObject({ ok: true, brain: 'faked' });
  });

  it('GET /api/health reports the model when a key is set', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const { status, json } = await call('GET', '/api/health');
    expect(status).toBe(200);
    expect(json).toMatchObject({ ok: true, brain: 'real', model: 'z-ai/glm-5.3-flash' });
  });

  it('GET /api/goal-log returns an empty log shape', async () => {
    const { status, json } = await call('GET', '/api/goal-log');
    expect(status).toBe(200);
    const body = json as { goalLog: { priorActionSteps: unknown[] } };
    expect(Array.isArray(body.goalLog.priorActionSteps)).toBe(true);
  });

  it('POST /api/brain proxies to the faked brain when no key is set', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const { status, json } = await call('POST', '/api/brain', input);
    expect(status).toBe(200);
    const body = json as { message: unknown };
    expect(typeof body.message).toBe('string');
    expect((body.message as string).length).toBeGreaterThan(0);
  });

  it('POST /api/brain with a key calls OpenRouter with an Authorization header', async () => {
    const fetchMock = vi.fn(async (_url: unknown, init?: { headers?: Record<string, string> }) => {
      return new Response(
        JSON.stringify({ choices: [{ message: { content: 'Framing question answered. OK to ask questions?' } }] }),
        { status: 200 },
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const { status, json } = await call('POST', '/api/brain', input);
    expect(status).toBe(200);
    expect(json).toMatchObject({ message: 'Framing question answered. OK to ask questions?' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(init.headers.authorization).toBe('Bearer test-key');
    // The response body (what the client receives) never carries the key.
    expect(JSON.stringify(json)).not.toContain('test-key');
  });

  it('POST /api/brain maps an upstream OpenRouter failure to 502, not 400', async () => {
    const fetchMock = vi.fn(async () => new Response('upstream exploded', { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const { status, json } = await call('POST', '/api/brain', input);
    expect(status).toBe(502);
    expect(json).toMatchObject({ error: expect.stringContaining('OpenRouter') });
  });

  it('POST /api/goal-log/append validates the record shape loudly', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const { status, json } = await call('POST', '/api/goal-log/append', { record: {} });
    expect(status).toBe(400);
    expect(json).toMatchObject({ error: expect.stringContaining('wrong shape') });
  });

  it('unknown routes return 404', async () => {
    const { status } = await call('GET', '/api/nope');
    expect(status).toBe(404);
  });

  it('GET /api/health reports voice as off when ElevenLabs env is unset', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('ELEVENLABS_API_KEY', '');
    vi.stubEnv('FUTURE_SELF_COACH_VOICE_ID', '');
    const { status, json } = await call('GET', '/api/health');
    expect(status).toBe(200);
    expect(json).toMatchObject({ ok: true, voice: 'off' });
  });

  it('GET /api/health reports voice as on when voice env is configured', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('ELEVENLABS_API_KEY', 'el-key');
    vi.stubEnv('FUTURE_SELF_COACH_VOICE_ID', 'voice-1');
    const { status, json } = await call('GET', '/api/health');
    expect(status).toBe(200);
    expect(json).toMatchObject({ ok: true, voice: 'on' });
  });

  it('POST /api/speak streams audio and never leaks the ElevenLabs key', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(new Uint8Array([1, 2, 3]).buffer, {
        status: 200,
        headers: { 'content-type': 'audio/mpeg' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('ELEVENLABS_API_KEY', 'secret-el-key');
    vi.stubEnv('FUTURE_SELF_COACH_VOICE_ID', 'voice-1');
    const { status, json } = await call('POST', '/api/speak', { text: 'Say this aloud.' });
    expect(status).toBe(200);
    expect(json).toBeNull(); // binary body, not JSON
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string> },
    ];
    expect(url).toContain('https://api.elevenlabs.io/v1/text-to-speech/voice-1');
    expect(init.headers['xi-api-key']).toBe('secret-el-key');
  });

  it('POST /api/speak with voice unconfigured returns 503 (voice off), not a crash', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('ELEVENLABS_API_KEY', '');
    vi.stubEnv('FUTURE_SELF_COACH_VOICE_ID', '');
    const { status, json } = await call('POST', '/api/speak', { text: 'hi' });
    expect(status).toBe(503);
    expect(json).toMatchObject({ error: expect.stringContaining('voice') });
  });

  it('POST /api/speak with a blank text fails loudly with 400', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('ELEVENLABS_API_KEY', 'el-key');
    vi.stubEnv('FUTURE_SELF_COACH_VOICE_ID', 'voice-1');
    const { status, json } = await call('POST', '/api/speak', { text: '   ' });
    expect(status).toBe(400);
    expect(json).toMatchObject({ error: expect.stringContaining('text') });
  });

  it('POST /api/speak maps an upstream ElevenLabs failure to 502', async () => {
    const fetchMock = vi.fn(async () => new Response('bad key', { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('OPENROUTER_API_KEY', '');
    vi.stubEnv('ELEVENLABS_API_KEY', 'el-key');
    vi.stubEnv('FUTURE_SELF_COACH_VOICE_ID', 'voice-1');
    const { status, json } = await call('POST', '/api/speak', { text: 'hi' });
    expect(status).toBe(502);
    expect(json).toMatchObject({ error: expect.stringContaining('ElevenLabs') });
  });

  it('malformed JSON bodies fail loudly with 400', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const req = {
      method: 'POST',
      url: '/api/brain',
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('{not json', 'utf8');
      },
    } as unknown as Req;
    let status = 0;
    let raw = '';
    const res = {
      writeHead: (s: number) => {
        status = s;
      },
      end: (p?: string) => {
        raw = p ?? '';
      },
    } as unknown as Res;
    await createRelayHandler()(req, res);
    expect(status).toBe(400);
    expect(JSON.parse(raw)).toMatchObject({ error: expect.stringContaining('not valid JSON') });
  });
});
