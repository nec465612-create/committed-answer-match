import { isSuccessfulReceipt, type ContractReceipt } from "../contract";
import {
  DurableJournal,
  journalKey,
  type JournalRecord,
  type SigningInput,
} from "../pending";

export interface WritePlan {
  journal: SigningInput;
  submit: () => Promise<string>;
  pollFinalized: (hash: string, attempt: number) => Promise<ContractReceipt | null>;
  verifyPost: () => Promise<boolean>;
  verifyPre: () => Promise<boolean>;
}

export interface ReconcilePlan {
  journal: JournalRecord;
  pollFinalized: (hash: string, attempt: number) => Promise<ContractReceipt | null>;
  verifyPost: () => Promise<boolean>;
  verifyPre: () => Promise<boolean>;
}

export type WriteOutcome =
  | { status: "CANCELLED"; journal: null }
  | { status: "RECONCILE"; journal: JournalRecord }
  | { status: "FINALIZED_ERROR"; journal: JournalRecord; receipt: ContractReceipt }
  | { status: "VERIFIED"; journal: JournalRecord; receipt: ContractReceipt };

export interface CoordinatorOptions {
  journal: DurableJournal;
  sleep?: (milliseconds: number) => Promise<void>;
  receiptDelays?: readonly number[];
  signal?: AbortSignal;
}

const DEFAULT_RECEIPT_DELAYS = [2000, 4000, 8000] as const;
const MAX_RECEIPT_QUERIES = 3;
const MAX_RETRY_AFTER_MS = 60_000;

function isUserRejected(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (code === 4001 || code === "4001") return true;
  }
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("user rejected") || message.includes("user denied") || message.includes("denied transaction");
}

function normalizeHash(value: unknown): string {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error("Wallet did not return a usable transaction hash.");
  }
  return value.toLowerCase();
}

async function safeCheck(check: () => Promise<boolean>): Promise<boolean> {
  try {
    return await check();
  } catch {
    return false;
  }
}

function abortError(): Error {
  return new Error("Transaction reconciliation was cancelled.");
}

async function wait(
  sleep: (milliseconds: number) => Promise<void>,
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  if (!signal) {
    await sleep(milliseconds);
    return;
  }
  if (signal.aborted) throw abortError();
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(abortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });
    void sleep(milliseconds).then(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }).catch((error) => {
      signal.removeEventListener("abort", onAbort);
      reject(error);
    });
  });
}

function retryAfterMilliseconds(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const candidate = error as {
    retryAfterMs?: unknown;
    retryAfter?: unknown;
    status?: unknown;
    response?: { headers?: { get?: (name: string) => string | null } };
    headers?: { get?: (name: string) => string | null };
  };
  const raw = candidate.retryAfterMs ?? candidate.retryAfter ?? candidate.response?.headers?.get?.("Retry-After") ?? candidate.headers?.get?.("Retry-After");
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return Math.min(Math.round(raw), MAX_RETRY_AFTER_MS);
  if (typeof raw === "string") {
    const seconds = Number(raw.trim());
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(Math.round(seconds * 1000), MAX_RETRY_AFTER_MS);
  }
  return candidate.status === 429 ? 1000 : null;
}

function delayedRetry(baseMilliseconds: number, error: unknown): number {
  const retryAfter = retryAfterMilliseconds(error);
  if (retryAfter === null) return baseMilliseconds;
  return Math.min(MAX_RETRY_AFTER_MS, Math.max(baseMilliseconds, retryAfter) + Math.floor(Math.random() * 200));
}

async function updateStatus(
  journal: DurableJournal,
  current: JournalRecord,
  status: JournalRecord["status"],
): Promise<JournalRecord> {
  return journal.update(journalKey(current.reservation), { ...current, status });
}

export async function executeWrite(plan: WritePlan, options: CoordinatorOptions): Promise<WriteOutcome> {
  const sleep = options.sleep ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const receiptDelays = [...(options.receiptDelays ?? DEFAULT_RECEIPT_DELAYS)].slice(0, MAX_RECEIPT_QUERIES);
  let current = await options.journal.createSigning(plan.journal);
  const key = journalKey(current.reservation);

  const update = async (status: JournalRecord["status"], txHash?: string): Promise<void> => {
    current = await options.journal.update(key, {
      ...current,
      status,
      ...(txHash !== undefined ? { tx_hash: txHash } : {}),
    });
  };

  let transactionHash: string;
  try {
    transactionHash = normalizeHash(await plan.submit());
    await update("SUBMITTED", transactionHash);
  } catch (error) {
    if (isUserRejected(error)) {
      await options.journal.removeUnsigned(key);
      return { status: "CANCELLED", journal: null };
    }
    await update("RECONCILE");
    return { status: "RECONCILE", journal: current };
  }

  let receipt: ContractReceipt | null = null;
  let nextDelay = receiptDelays[0] ?? 0;
  for (let index = 0; index < receiptDelays.length; index += 1) {
    try {
      await wait(sleep, nextDelay, options.signal);
    } catch {
      await update("RECONCILE");
      return { status: "RECONCILE", journal: current };
    }
    try {
      const candidate = await plan.pollFinalized(transactionHash, index + 1);
      if (candidate && candidate.statusName === "FINALIZED") {
        receipt = candidate;
        break;
      }
    } catch (error) {
      if (index + 1 < receiptDelays.length) nextDelay = delayedRetry(receiptDelays[index + 1], error);
    }
    if (index + 1 < receiptDelays.length && nextDelay === receiptDelays[index]) nextDelay = receiptDelays[index + 1];
  }

  if (!receipt) {
    await update("RECONCILE");
    return { status: "RECONCILE", journal: current };
  }

  if (isSuccessfulReceipt(receipt)) {
    if (await safeCheck(plan.verifyPost)) {
      await update("VERIFIED");
      return { status: "VERIFIED", journal: current, receipt };
    }
    await update("RECONCILE");
    return { status: "RECONCILE", journal: current };
  }

  if (await safeCheck(plan.verifyPre)) {
    await update("FINALIZED_ERROR");
    return { status: "FINALIZED_ERROR", journal: current, receipt };
  }
  await update("RECONCILE");
  return { status: "RECONCILE", journal: current };
}

export async function reconcileWrite(plan: ReconcilePlan, options: CoordinatorOptions): Promise<WriteOutcome> {
  if (plan.journal.tx_hash === "") return { status: "RECONCILE", journal: plan.journal };
  let receipt: ContractReceipt | null = null;
  try {
    receipt = await plan.pollFinalized(plan.journal.tx_hash, 1);
  } catch {
    try {
      const journal = await updateStatus(options.journal, plan.journal, "RECONCILE");
      return { status: "RECONCILE", journal };
    } catch {
      return { status: "RECONCILE", journal: plan.journal };
    }
  }
  if (!receipt || receipt.statusName !== "FINALIZED") {
    try {
      const journal = await updateStatus(options.journal, plan.journal, "RECONCILE");
      return { status: "RECONCILE", journal };
    } catch {
      return { status: "RECONCILE", journal: plan.journal };
    }
  }

  if (isSuccessfulReceipt(receipt)) {
    if (await safeCheck(plan.verifyPost)) {
      try {
        const journal = await updateStatus(options.journal, plan.journal, "VERIFIED");
        return { status: "VERIFIED", journal, receipt };
      } catch {
        return { status: "RECONCILE", journal: plan.journal };
      }
    }
  } else if (await safeCheck(plan.verifyPre)) {
    try {
      const journal = await updateStatus(options.journal, plan.journal, "FINALIZED_ERROR");
      return { status: "FINALIZED_ERROR", journal, receipt };
    } catch {
      return { status: "RECONCILE", journal: plan.journal };
    }
  }

  try {
    const journal = await updateStatus(options.journal, plan.journal, "RECONCILE");
    return { status: "RECONCILE", journal };
  } catch {
    return { status: "RECONCILE", journal: plan.journal };
  }
}
