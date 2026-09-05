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
  pollFinalized: (hash: string) => Promise<ContractReceipt | null>;
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
  readbackRetryDelay?: number;
}

const DEFAULT_RECEIPT_DELAYS = [2000, 4000, 8000] as const;
const DEFAULT_READBACK_RETRY_DELAY = 4000;

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

export async function executeWrite(plan: WritePlan, options: CoordinatorOptions): Promise<WriteOutcome> {
  const sleep = options.sleep ?? ((milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));
  const receiptDelays = options.receiptDelays ?? DEFAULT_RECEIPT_DELAYS;
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
  for (const delay of receiptDelays) {
    await sleep(delay);
    try {
      const candidate = await plan.pollFinalized(transactionHash);
      if (candidate && candidate.statusName === "FINALIZED") {
        receipt = candidate;
        break;
      }
    } catch {
      // A bounded retry is safer than declaring either success or failure.
    }
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
    await sleep(options.readbackRetryDelay ?? DEFAULT_READBACK_RETRY_DELAY);
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
  await sleep(options.readbackRetryDelay ?? DEFAULT_READBACK_RETRY_DELAY);
  if (await safeCheck(plan.verifyPre)) {
    await update("FINALIZED_ERROR");
    return { status: "FINALIZED_ERROR", journal: current, receipt };
  }
  await update("RECONCILE");
  return { status: "RECONCILE", journal: current };
}
