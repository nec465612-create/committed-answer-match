export interface RpcBudgetRow {
  id: string;
  maxRequests: number;
  maxRetries: number;
  baseBackoffMs: number;
  cacheTtlMs: number;
}

export interface RpcMetric {
  rowId: string;
  key: string;
  source: "network" | "cache" | "in-flight";
  attempt: number;
  at: number;
}

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

function canonical(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, Json>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function rpcKey(input: { chainId: number; contract: `0x${string}`; method: string; args: Json }): string {
  return canonical(input);
}

function retryAfterMs(cause: unknown): number | undefined {
  const value = cause as { retryAfterMs?: unknown; retry_after_seconds?: unknown; response?: { headers?: { get?: (name: string) => string | null } } } | null;
  if (typeof value?.retryAfterMs === "number") return Math.max(0, value.retryAfterMs);
  if (typeof value?.retry_after_seconds === "number") return Math.max(0, value.retry_after_seconds * 1000);
  const header = value?.response?.headers?.get?.("Retry-After");
  if (header !== null && header !== undefined && Number.isFinite(Number(header))) return Math.max(0, Number(header) * 1000);
  return undefined;
}

function defaultRetryable(cause: unknown): boolean {
  const value = cause as { status?: unknown; code?: unknown } | null;
  return value?.status === 429 || value?.code === 429 || value?.code === -32005;
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export function createRpcBudgetGuard(rows: readonly RpcBudgetRow[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const counts = new Map<string, number>();
  const inFlight = new Map<string, Promise<unknown>>();
  const cache = new Map<string, { expiresAt: number; value: unknown }>();
  const evidence: RpcMetric[] = [];

  function row(id: string): RpcBudgetRow {
    const value = byId.get(id);
    if (!value) throw new Error(`Unknown RPC budget row: ${id}`);
    return value;
  }

  function spend(id: string): number {
    const next = (counts.get(id) ?? 0) + 1;
    if (next > row(id).maxRequests) throw new Error(`RPC budget exceeded: ${id}`);
    counts.set(id, next);
    return next;
  }

  async function request<T>(input: {
    rowId: string;
    key: string;
    signal: AbortSignal;
    call: () => Promise<T>;
    isRetryable?: (cause: unknown) => boolean;
  }): Promise<T> {
    const budget = row(input.rowId);
    const scopedKey = `${input.rowId}:${input.key}`;
    const cached = cache.get(scopedKey);
    if (budget.cacheTtlMs > 0 && cached && cached.expiresAt > Date.now()) {
      evidence.push({ rowId: input.rowId, key: input.key, source: "cache", attempt: 0, at: Date.now() });
      return cached.value as T;
    }
    const active = inFlight.get(scopedKey);
    if (active) {
      evidence.push({ rowId: input.rowId, key: input.key, source: "in-flight", attempt: 0, at: Date.now() });
      return active as Promise<T>;
    }

    const operation = (async () => {
      for (let attempt = 0; ; attempt += 1) {
        input.signal.throwIfAborted();
        spend(input.rowId);
        evidence.push({ rowId: input.rowId, key: input.key, source: "network", attempt, at: Date.now() });
        try {
          const value = await input.call();
          if (budget.cacheTtlMs > 0) cache.set(scopedKey, { expiresAt: Date.now() + budget.cacheTtlMs, value });
          return value;
        } catch (cause) {
          if (!(input.isRetryable ?? defaultRetryable)(cause) || attempt >= budget.maxRetries) throw cause;
          const serverDelay = retryAfterMs(cause);
          const exponential = budget.baseBackoffMs * (2 ** attempt);
          const jitter = Math.floor(Math.random() * Math.max(1, budget.baseBackoffMs));
          await wait(serverDelay ?? exponential + jitter, input.signal);
        }
      }
    })();
    inFlight.set(scopedKey, operation);
    try {
      return await operation;
    } finally {
      inFlight.delete(scopedKey);
    }
  }

  async function poll<T>(input: {
    rowId: string;
    key: string;
    signal: AbortSignal;
    intervalMs: number;
    maxPolls: number;
    call: () => Promise<T>;
    terminal: (value: T) => boolean;
  }): Promise<T> {
    if (input.intervalMs <= 0 || input.maxPolls <= 0) throw new Error("Polling must be bounded.");
    for (let pollNumber = 1; pollNumber <= input.maxPolls; pollNumber += 1) {
      const value = await request({ rowId: input.rowId, key: `${input.key}:${pollNumber}`, signal: input.signal, call: input.call });
      if (input.terminal(value)) return value;
      if (pollNumber < input.maxPolls) await wait(input.intervalMs, input.signal);
    }
    throw new Error("RPC polling ended before a terminal state. Reconcile the existing state; do not resubmit.");
  }

  function invalidate(match: (key: string) => boolean): void {
    for (const key of cache.keys()) if (match(key)) cache.delete(key);
  }

  return {
    request,
    poll,
    invalidate,
    counts: () => Object.fromEntries(counts),
    evidence: () => evidence.slice(),
  };
}

const readClients = new Map<string, unknown>();

export function sharedReadClient<T>(key: string, create: () => T): T {
  const current = readClients.get(key);
  if (current) return current as T;
  const client = create();
  readClients.set(key, client);
  return client;
}
