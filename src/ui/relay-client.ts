/**
 * Browser-side client for the relay (ticket 04). The UI talks only to the
 * relay; keys stay server-side. Thin fetch wrappers with fail-loud errors.
 */

export interface Health {
  ok: boolean;
  brain: 'real' | 'faked';
  model?: string;
}

async function parseBody<T>(res: Response): Promise<T> {
  const body: unknown = await res.json().catch(() => {
    throw new Error(`relay: response was not JSON (HTTP ${res.status})`);
  });
  if (!res.ok) {
    const err = body as { error?: unknown };
    const message =
      typeof err === 'object' && err != null && typeof (err as { error?: unknown }).error === 'string'
        ? (err as { error: string }).error
        : `relay: HTTP ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

/** Confirms the relay is up and which Brain it will use. */
export async function fetchHealth(): Promise<Health> {
  const res = await fetch('/api/health');
  return parseBody<Health>(res);
}

/** Asks the relay's Brain for one coach turn. */
export async function postBrain(input: unknown): Promise<{ message: string }> {
  const res = await fetch('/api/brain', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  return parseBody<{ message: string }>(res);
}

/** Fetches the Goal Log (prior Action Steps) for a new Check-in. */
export async function fetchGoalLog(): Promise<unknown> {
  const res = await fetch('/api/goal-log');
  const body = await parseBody<{ goalLog: unknown }>(res);
  return body.goalLog;
}

/** Appends a closed Check-in to the Goal Log. */
export async function postGoalLogAppend(record: unknown): Promise<void> {
  const res = await fetch('/api/goal-log/append', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ record }),
  });
  await parseBody<{ ok: boolean }>(res);
}
