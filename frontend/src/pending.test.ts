// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  DurableJournal,
  JOURNAL_INDEX_KEY,
  canonicalJson,
  journalKey,
  type JournalStorage,
  type LockManagerLike,
} from "./pending";

class MemoryStorage implements JournalStorage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class ImmediateLocks implements LockManagerLike {
  readonly names: string[] = [];

  async request(name: string, _options: { mode: "exclusive" }, callback: (lock: unknown) => Promise<unknown>): Promise<unknown> {
    this.names.push(name);
    return callback({});
  }
}

const CONTRACT = "0x" + "1".repeat(40);
const ACCOUNT = "0x" + "2".repeat(40);

function input(index: number) {
  return {
    chain: "61999",
    contract: CONTRACT,
    account: ACCOUNT,
    method: "create_match",
    intent: `create:${ACCOUNT}:nonce${index.toString().padStart(2, "0")}`,
    argsJson: canonicalJson([String(index)]),
    preRevision: "0",
    preHash: "0".repeat(64),
    createdMs: String(index),
  };
}

describe("DurableJournal", () => {
  it("writes a reservation before index update and rebuilds an orphaned index", async () => {
    const storage = new MemoryStorage();
    const locks = new ImmediateLocks();
    const journal = new DurableJournal(storage, locks);
    const record = await journal.createSigning(input(1));

    expect(storage.getItem(journalKey(record.reservation))).not.toBeNull();
    expect(JSON.parse(storage.getItem(JOURNAL_INDEX_KEY) ?? "[]")).toEqual([journalKey(record.reservation)]);
    storage.removeItem(JOURNAL_INDEX_KEY);
    expect((await journal.list()).map((item) => item.reservation)).toEqual([record.reservation]);
    expect(JSON.parse(storage.getItem(JOURNAL_INDEX_KEY) ?? "[]")).toEqual([journalKey(record.reservation)]);
    expect(locks.names.every((name) => name === "genlayer-journal-v1")).toBe(true);
  });

  it("blocks a second pending write for the same case even with another account or method", async () => {
    const journal = new DurableJournal(new MemoryStorage(), new ImmediateLocks());
    await journal.createSigning({
      ...input(1),
      method: "evaluate_match",
      intent: "evaluate_match:7:3",
      argsJson: canonicalJson(["7", "3"]),
      preRevision: "3",
      preHash: "a".repeat(64),
    });

    await expect(
      journal.createSigning({
        ...input(2),
        account: "0x" + "3".repeat(40),
        method: "expire_match",
        intent: "expire_match:7:3",
        argsJson: canonicalJson(["7", "3"]),
        preRevision: "3",
        preHash: "a".repeat(64),
      }),
    ).rejects.toMatchObject({ kind: "conflict" });
  });

  it("keeps a nonempty transaction hash immutable", async () => {
    const journal = new DurableJournal(new MemoryStorage(), new ImmediateLocks());
    const record = await journal.createSigning(input(1));
    const hash = "0x" + "a".repeat(64);
    await journal.update(journalKey(record.reservation), { ...record, status: "SUBMITTED", tx_hash: hash });

    await expect(
      journal.update(journalKey(record.reservation), {
        ...record,
        status: "RECONCILE",
        tx_hash: "0x" + "b".repeat(64),
      }),
    ).rejects.toMatchObject({ kind: "data" });
  });

  it("fails signing when Web Locks are unavailable", async () => {
    const journal = new DurableJournal(new MemoryStorage(), null);
    await expect(journal.createSigning(input(1))).rejects.toMatchObject({ kind: "lock" });
  });

  it("blocks the 33rd journal record", async () => {
    const journal = new DurableJournal(new MemoryStorage(), new ImmediateLocks());
    for (let index = 1; index <= 32; index += 1) await journal.createSigning(input(index));
    await expect(journal.createSigning(input(33))).rejects.toMatchObject({ kind: "capacity" });
  });
});
