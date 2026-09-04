import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRealBrain } from './real-brain.js';
import type { ConversationState } from '../core/types.js';

/**
 * Tests for the real LLM Brain (ticket 02). The OpenRouter HTTP leg is
 * stubbed on globalThis.fetch: no test touches the network. The seam shape
 * (BrainInput -> LlmResponse, async) and the flow-integrity contract (the
 * response must carry the flow question Coach Core asked) are what is
 * pinned here; the live smoke check runs against the real API, not here.
 */

const state: ConversationState = {
  turns: [{ role: 'user', text: 'Ship the demo.', phase: 'TOWARD' }],
  phase: 'TOWARD',
};

const ENV_KEY = 'test-openrouter-key';

beforeEach(() => {
  process.env.FUTURE_SELF_COACH_MODEL = 'test/glm-model';
});

afterEach(() => {
  delete process.env.FUTURE_SELF_COACH_MODEL;
  vi.unstubAllGlobals();
});

function stubFetch(responseBody: unknown, ok = true, status = 200): {
  url: string;
  init: RequestInit;
}[] {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal(
    'fetch',
    (async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify(responseBody), {
        status,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch,
  );
  return calls;
}

function openRouterBody(content: string): unknown {
  return {
    id: 'gen-test',
    object: 'chat.completion',
    model: 'test/glm-model',
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }],
  };
}

describe('real Brain: request shape', () => {
  it('sends the model id from the one env var to the OpenRouter chat endpoint', async () => {
    const calls = stubFetch(openRouterBody('What happens if you make it happen?'));
    const brain = createRealBrain({ apiKey: ENV_KEY });

    await brain({ state, question: 'What happens if you make it happen?' });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://openrouter.ai/api/v1/chat/completions');
    const body = JSON.parse(String(calls[0]!.init.body)) as {
      model: string;
      messages: { role: string; content: string }[];
    };
    // The single env var decides the Brain (ticket 02 acceptance).
    expect(body.model).toBe('test/glm-model');
    expect(body.messages.length).toBeGreaterThan(0);
  });

  it('sends the API key only as the Authorization header, never in the body', async () => {
    const calls = stubFetch(openRouterBody('ok'));
    const brain = createRealBrain({ apiKey: ENV_KEY });

    await brain({ state, question: 'What do you want most right now?' });

    const headers = new Headers(calls[0]!.init.headers);
    expect(headers.get('authorization')).toBe(`Bearer ${ENV_KEY}`);
    expect(String(calls[0]!.init.body)).not.toContain(ENV_KEY);
  });

  it('carries the persona, Goal Log, flow phase, and exact question to the model', async () => {
    const calls = stubFetch(openRouterBody('ok'));
    const brain = createRealBrain({
      apiKey: ENV_KEY,
      goalLog: {
        priorActionSteps: [{ action: 'Draft the demo spec', when: '2026-09-03 09:00' }],
        notes: 'Demo goal: prove the coaching flow end-to-end.',
      },
    });

    await brain({ state, question: 'What happens if you make it happen?' });

    const body = JSON.parse(String(calls[0]!.init.body)) as {
      messages: { role: string; content: string }[];
    };
    const system = body.messages[0]!;
    expect(system.role).toBe('system');
    // Persona (CONTEXT.md: future self, compassionate but demanding).
    expect(system.content).toContain('future self');
    expect(system.content.toLowerCase()).toContain('compassionate');
    // Goal Log content the coach should be able to reference.
    expect(system.content).toContain('Draft the demo spec');
    expect(system.content).toContain('Demo goal: prove the coaching flow end-to-end.');
    // Flow discipline: phase + the exact question Coach Core asked.
    expect(system.content).toContain('TOWARD');
    const last = body.messages.at(-1)!;
    expect(last?.content).toContain('What happens if you make it happen?');
  });

  it('sends the conversation transcript so the Brain writes prose, not amnesia', async () => {
    const calls = stubFetch(openRouterBody('ok'));
    const brain = createRealBrain({ apiKey: ENV_KEY });

    await brain({
      state: {
        turns: [
          { role: 'coach', text: 'What do you want most right now?', phase: 'TOWARD' },
          { role: 'user', text: 'I want the demo shipped by Friday.', phase: 'TOWARD' },
        ],
        phase: 'TOWARD',
      },
      question: 'What happens if you make it happen?',
    });

    const body = JSON.parse(String(calls[0]!.init.body)) as {
      messages: { role: string; content: string }[];
    };
    const contents = body.messages.map((m) => m.content);
    expect(contents.some((c) => c.includes('demo shipped by Friday'))).toBe(true);
  });
});

describe('real Brain: response contract', () => {
  it('returns the model prose as the LlmResponse message', async () => {
    stubFetch(openRouterBody('I hear you. What happens if you make it happen?'));
    const brain = createRealBrain({ apiKey: ENV_KEY });

    const reply = await brain({
      state,
      question: 'What happens if you make it happen?',
    });

    expect(reply.message).toBe('I hear you. What happens if you make it happen?');
  });

  it('retries once when the model reply drifts and omits the flow question', async () => {
    const calls = stubFetch(openRouterBody('Freeform chat drift with no question.'));
    const brain = createRealBrain({ apiKey: ENV_KEY });

    const reply = await brain({
      state,
      question: 'What happens if you make it happen?',
    });

    // Two HTTP calls: the drifted one, then the corrective retry.
    expect(calls).toHaveLength(2);
    const retryBody = JSON.parse(String(calls[1]!.init.body)) as {
      messages: { role: string; content: string }[];
    };
    expect(
      retryBody.messages.some((m) => m.content.includes('drifted')),
    ).toBe(true);
    // The question still reaches the client: flow integrity over prose.
    expect(reply.message).toContain('What happens if you make it happen?');
  });

  it('retries once, then appends the exact question when the model keeps drifting', async () => {
    const calls = stubFetch(openRouterBody('Still drifting.'));
    const brain = createRealBrain({ apiKey: ENV_KEY });

    const reply = await brain({
      state,
      question: 'What happens if you make it happen?',
    });

    expect(calls).toHaveLength(2);
    expect(reply.message).toContain('Still drifting.');
    expect(reply.message).toContain('What happens if you make it happen?');
  });

  it('does not require a question when Coach Core asks none (ENROLL/CLOSED turns)', async () => {
    stubFetch(openRouterBody('We are locked in. Are you in?'));
    const brain = createRealBrain({ apiKey: ENV_KEY });

    const reply = await brain({
      state: { turns: [], phase: 'ENROLL' },
      actionStep: { action: 'Write the opening', when: '9am' },
    });

    expect(reply.message).toBe('We are locked in. Are you in?');
  });

  it('carries the Action Step at ENROLL so the Brain sells it, not describes it', async () => {
    const calls = stubFetch(openRouterBody('Locked in?'));
    const brain = createRealBrain({ apiKey: ENV_KEY });

    await brain({
      state: { turns: [], phase: 'ENROLL' },
      actionStep: { action: 'Write the opening', when: '9am' },
    });

    const body = JSON.parse(String(calls[0]!.init.body)) as {
      messages: { role: string; content: string }[];
    };
    const system = body.messages[0]!.content;
    expect(system).toContain('Write the opening');
    expect(system).toContain('9am');
    expect(system.toLowerCase()).toContain('enroll');
  });
});

describe('real Brain: fail fast', () => {
  it('throws on a missing API key at construction, naming the env var', () => {
    expect(() => createRealBrain({ apiKey: '  ' })).toThrow(/OPENROUTER_API_KEY/);
  });

  it('throws a named error when the OpenRouter call fails', async () => {
    stubFetch({ error: { message: 'rate limited' } }, false, 429);
    const brain = createRealBrain({ apiKey: ENV_KEY });

    await expect(
      brain({ state, question: 'What do you want most right now?' }),
    ).rejects.toThrow(/OpenRouter.*429/);
  });

  it('throws a named error when the model returns an empty message', async () => {
    stubFetch(openRouterBody('   '));
    const brain = createRealBrain({ apiKey: ENV_KEY });

    await expect(
      brain({ state, question: 'What do you want most right now?' }),
    ).rejects.toThrow(/empty/i);
  });
});

describe('real Brain: model id from one env var', () => {
  it('changing FUTURE_SELF_COACH_MODEL changes the request, defaulting to GLM-5.3-flash', async () => {
    const calls = stubFetch(
      openRouterBody('Good. What do you want most right now?'),
    );
    const brain = createRealBrain({ apiKey: ENV_KEY });

    await brain({ state, question: 'What do you want most right now?' });
    expect(JSON.parse(String(calls[0]!.init.body)).model).toBe('test/glm-model');

    delete process.env.FUTURE_SELF_COACH_MODEL;
    await brain({ state, question: 'What do you want most right now?' });
    expect(JSON.parse(String(calls[1]!.init.body)).model).toBe('z-ai/glm-5.3-flash');
  });
});
