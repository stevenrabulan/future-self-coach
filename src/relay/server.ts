/**
 * The Relay (ticket 04): a thin local HTTP server that holds the API keys
 * server-side. The browser UI talks only to this relay (same-origin via the
 * Vite dev proxy); OpenRouter is called here, never from the client.
 *
 * Endpoints (JSON):
 *   GET  /api/health          → { ok, brain: "real" | "faked", model? }
 *   GET  /api/goal-log        → { goalLog }   (parsed from goals.local.md)
 *   POST /api/brain           → { message }   (body: the BrainInput Coach
 *                              Core produces; the relay loads the Goal Log
 *                              itself — the client never supplies one)
 *   POST /api/goal-log/append → { ok: true }  (body: { record })
 *
 * Zero new dependencies (node:http), matching the repo's zero-dep style.
 * The Goal Log file is resolved from the repo root, not the process cwd, so
 * the relay and the CLI always read and append the same file regardless of
 * how the relay was started. Binds to 127.0.0.1: the relay holds secrets
 * and must not listen on the network.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { dirname, join } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRealBrain, readApiKeyFromEnv, readModelFromEnv } from '../brain/real-brain.js';
import { fakeBrain } from '../brain/fake-brain.js';
import {
  appendCheckin,
  EMPTY_GOAL_LOG_MARKDOWN,
  parseGoalLog,
  type CheckinRecord,
} from '../log/goal-log.js';
import type { BrainInput, GoalLog, LlmBrain } from '../core/types.js';
import { createTtsClient, readTtsConfigFromEnv } from '../voice/tts.js';

const DEFAULT_PORT = 8787;
const HOST = '127.0.0.1';
/** Repo root: this file lives at <root>/src/relay/server.ts. */
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GOAL_LOG_PATH = join(REPO_ROOT, 'goals.local.md');

export const emptyGoalLog = (): GoalLog => ({ priorActionSteps: [] });

/** Loads the Goal Log; missing file → empty log (first Check-in). */
export function loadGoalLog(): GoalLog {
  if (!existsSync(GOAL_LOG_PATH)) return emptyGoalLog();
  return parseGoalLog(readFileSync(GOAL_LOG_PATH, 'utf8'));
}

/** Appends one closed Check-in to the Goal Log file (read-append-write). */
export function appendGoalLogRecord(record: CheckinRecord): void {
  const markdown = existsSync(GOAL_LOG_PATH)
    ? readFileSync(GOAL_LOG_PATH, 'utf8')
    : EMPTY_GOAL_LOG_MARKDOWN;
  writeFileSync(GOAL_LOG_PATH, appendCheckin(markdown, record), 'utf8');
}

/** Real Brain when the key exists; the faked fallback otherwise (CLI parity). */
export function pickBrain(goalLog: GoalLog): { brain: LlmBrain; label: string } {
  try {
    const apiKey = readApiKeyFromEnv();
    return {
      brain: createRealBrain({ apiKey, goalLog }),
      label: `real LLM: ${readModelFromEnv()} via OpenRouter`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('OPENROUTER_API_KEY')) throw err;
    return { brain: fakeBrain, label: 'faked LLM (no OPENROUTER_API_KEY)' };
  }
}

/** Reads and parses one JSON request body; fails loudly on bad input. */
export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`readJsonBody: request body is not valid JSON: ${raw.slice(0, 200)}`);
  }
}

/** Minimal structural guards at the boundary; the modules re-validate. */
function assertShape(value: unknown, name: string, check: (v: object) => boolean): asserts value is object {
  if (typeof value !== 'object' || value == null || !check(value)) {
    throw new Error(`request body: ${name} has the wrong shape`);
  }
}

/** Writes one JSON response. */
function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(payload);
}

/**
 * The relay's request handler, extracted for testability (thin, but the
 * routing and error mapping live here so the listen call stays trivial).
 */
export function createRelayHandler(): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${HOST}`);
    try {
      if (req.method === 'GET' && url.pathname === '/api/health') {
        const probe = pickBrain(emptyGoalLog());
        const hasKey = probe.label.startsWith('real');
        const voice = readTtsConfigFromEnv() != null ? 'on' : 'off';
        return sendJson(res, 200, {
          ok: true,
          brain: hasKey ? 'real' : 'faked',
          model: hasKey ? readModelFromEnv() : undefined,
          voice,
        });
      }
      if (req.method === 'GET' && url.pathname === '/api/goal-log') {
        return sendJson(res, 200, { goalLog: loadGoalLog() });
      }
      if (req.method === 'POST' && url.pathname === '/api/brain') {
        const body = await readJsonBody(req);
        // The relay owns the Goal Log file: it loads the log itself per
        // request instead of trusting a client-supplied copy. The client
        // posts only the BrainInput Coach Core produces.
        assertShape(body, 'body', (b) => 'state' in (b as { state?: unknown }));
        const input = body as BrainInput;
        const { brain } = pickBrain(loadGoalLog());
        try {
          const { message } = await brain(input);
          return sendJson(res, 200, { message });
        } catch (err: unknown) {
          // Upstream (OpenRouter) failure: the request was well-formed, so
          // this is a bad gateway, not a bad request. Propagates loudly.
          const message = err instanceof Error ? err.message : String(err);
          return sendJson(res, 502, { error: message });
        }
      }
      if (req.method === 'POST' && url.pathname === '/api/goal-log/append') {
        const body = await readJsonBody(req);
        assertShape(body, 'body', (b) => 'record' in b);
        const { record } = body as { record: unknown };
        assertShape(record, 'record', (b) => 'actionStep' in b && 'date' in b);
        // appendGoalLogRecord → appendCheckin re-validates every field of
        // the record (date, wantedMost, consequence, action, when) and
        // throws loudly on any missing piece, so a half-shaped record can
        // never corrupt the Goal Log.
        appendGoalLogRecord(record as CheckinRecord);
        return sendJson(res, 200, { ok: true });
      }
      if (req.method === 'POST' && url.pathname === '/api/speak') {
        const body = await readJsonBody(req);
        assertShape(body, 'body', (b) => 'text' in b && typeof (b as { text?: unknown }).text === 'string');
        const { text } = body as { text: string };
        if (text.trim() === '') {
          return sendJson(res, 400, { error: 'request body: text must be a non-empty string' });
        }
        const ttsConfig = readTtsConfigFromEnv();
        if (ttsConfig == null) {
          return sendJson(res, 503, {
            error: 'voice is off: set ELEVENLABS_API_KEY and FUTURE_SELF_COACH_VOICE_ID in the gitignored .env',
          });
        }
        try {
          const audio = await createTtsClient(ttsConfig)(text);
          // Stream the audio bytes straight through; the key never crosses
          // to the client because it only exists in the upstream request.
          res.writeHead(200, { 'content-type': audio.headers.get('content-type') ?? 'audio/mpeg' });
          const reader = audio.body?.getReader();
          if (reader == null) {
            res.end();
            return;
          }
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
          res.end();
          return;
        } catch (err: unknown) {
          // Upstream (ElevenLabs) failure: bad gateway, not a bad request.
          const message = err instanceof Error ? err.message : String(err);
          return sendJson(res, 502, { error: message });
        }
      }
      return sendJson(res, 404, { error: `no route: ${req.method} ${url.pathname}` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return sendJson(res, 400, { error: message });
    }
  };
}

/** Starts the relay; resolves with the bound port (for tests / callers). */
export function startRelay(port: number = DEFAULT_PORT): Promise<ReturnType<typeof createServer>> {
  const server = createServer((req, res) => {
    createRelayHandler()(req, res).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      sendJson(res, 500, { error: message });
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, HOST, () => {
      const { brain, label } = pickBrain(loadGoalLog());
      console.log(`=== Future Self Coach relay on http://${HOST}:${port} (${label}) ===`);
      resolve(server);
    });
  });
}

const isMain = process.argv[1] != null && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isMain) {
  const portEnv = process.env.FUTURE_SELF_COACH_RELAY_PORT;
  const port = portEnv != null && portEnv.trim() !== '' ? Number(portEnv) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port <= 0) {
    console.error(`startRelay: FUTURE_SELF_COACH_RELAY_PORT must be a positive integer, got: ${portEnv}`);
    process.exitCode = 1;
  } else {
    void startRelay(port);
  }
}
