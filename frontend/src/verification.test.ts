// @vitest-environment node
import { describe, expect, it } from "vitest";
import { type CaseRecord } from "./contract";
import {
  backupBinding,
  matchesActionPostcondition,
  matchesJournalActionPostcondition,
} from "./verification";

const A = "0x" + "1".repeat(40);
const B = "0x" + "2".repeat(40);
const HASH = "a".repeat(64);

function record(overrides: Partial<CaseRecord> = {}): CaseRecord {
  return {
    v: 1,
    id: "1",
    primary: A,
    secondary: B,
    phase: "GUESS_OPEN",
    revision: "1",
    parent: "0",
    create_hash: HASH,
    base: { clue: "clue", commitment: HASH },
    response: {},
    base_locked: true,
    response_locked: false,
    accepted_attempts: 0,
    last_accepted_at: "0",
    outcome: "",
    result: {},
    domain: { nonce: "b".repeat(32), answer: "", salt: "", deadline: "100" },
    last_operation: { method: "create_match", caller: A, args_hash: HASH },
    ...overrides,
  };
}

describe("exact case postconditions", () => {
  it("accepts the complete submit, reveal, evaluate, retry and expire transitions", () => {
    const guess = record({
      phase: "REVEAL_WAIT",
      revision: "2",
      response: { guess: "hello" },
      response_locked: true,
      domain: { nonce: "b".repeat(32), answer: "", salt: "", deadline: "200" },
      last_operation: { method: "submit_guess", caller: B, args_hash: HASH },
    });
    expect(matchesActionPostcondition({ before: record(), after: guess, method: "submit_guess", caller: B, argsHash: HASH, args: ["1", "hello", "1"] })).toBe(true);

    const frozen = record({
      phase: "FROZEN",
      revision: "3",
      response: { guess: "hello" },
      response_locked: true,
      domain: { nonce: "b".repeat(32), answer: "hello", salt: "c".repeat(32), deadline: "300" },
      last_operation: { method: "reveal_answer", caller: A, args_hash: HASH },
    });
    expect(matchesActionPostcondition({ before: guess, after: frozen, method: "reveal_answer", caller: A, argsHash: HASH, args: ["1", "hello", "c".repeat(32), "2"] })).toBe(true);

    const done = record({
      phase: "DONE",
      revision: "4",
      response: { guess: "hello" },
      response_locked: true,
      accepted_attempts: 1,
      last_accepted_at: "400",
      outcome: "MATCH",
      result: { v: 1, label: "MATCH" },
      domain: { nonce: "b".repeat(32), answer: "hello", salt: "c".repeat(32), deadline: "300" },
      last_operation: { method: "evaluate_match", caller: B, args_hash: HASH },
    });
    expect(matchesActionPostcondition({ before: frozen, after: done, method: "evaluate_match", caller: B, argsHash: HASH, args: ["1", "3"] })).toBe(true);

    const exhaustedBefore = record({
      phase: "UNRESOLVED",
      revision: "4",
      response: { guess: "hello" },
      response_locked: true,
      accepted_attempts: 2,
      last_accepted_at: "400",
      result: { v: 1, label: "UNKNOWN" },
      domain: { nonce: "b".repeat(32), answer: "hello", salt: "c".repeat(32), deadline: "300" },
      last_operation: { method: "evaluate_match", caller: B, args_hash: HASH },
    });
    const exhausted = { ...exhaustedBefore, phase: "EXHAUSTED", revision: "5", accepted_attempts: 3, last_accepted_at: "500", last_operation: { method: "retry_match", caller: B, args_hash: HASH } } satisfies CaseRecord;
    expect(matchesActionPostcondition({ before: exhaustedBefore, after: exhausted, method: "retry_match", caller: B, argsHash: HASH, args: ["1", "4"] })).toBe(true);

    const voided = { ...record(), phase: "DONE", revision: "2", outcome: "VOID", last_operation: { method: "expire_match", caller: B, args_hash: HASH } } satisfies CaseRecord;
    expect(matchesActionPostcondition({ before: record(), after: voided, method: "expire_match", caller: B, argsHash: HASH, args: ["1", "1"] })).toBe(true);
  });

  it("rejects a broad terminal phase with the wrong method-specific consequence", () => {
    const invalid = record({
      phase: "DONE",
      revision: "2",
      last_operation: { method: "evaluate_match", caller: B, args_hash: HASH },
    });
    expect(matchesActionPostcondition({ before: record({ phase: "FROZEN" }), after: invalid, method: "evaluate_match", caller: B, argsHash: HASH, args: ["1", "1"] })).toBe(false);
  });

  it("reconciles an action from one post-version read without fabricating a pre-state", () => {
    const post = record({
      phase: "REVEAL_WAIT",
      revision: "2",
      response: { guess: "hello" },
      response_locked: true,
      last_operation: { method: "submit_guess", caller: B, args_hash: HASH },
    });
    expect(matchesJournalActionPostcondition({ record: post, method: "submit_guess", caller: B, argsHash: HASH, args: ["1", "hello", "1"], preRevision: "1" })).toBe(true);
    expect(matchesJournalActionPostcondition({ record: { ...post, phase: "DONE", revision: "2" }, method: "submit_guess", caller: B, argsHash: HASH, args: ["1", "hello", "1"], preRevision: "1" })).toBe(false);
  });
});

describe("backup binding", () => {
  it("changes when any commitment context changes", () => {
    const base = {
      chain: "61999", contract: A, creator: A, opponent: B, nonce: "b".repeat(32), clue: "clue", answer: "answer", salt: "c".repeat(32), commitment: HASH,
    };
    expect(backupBinding(base)).not.toBe(backupBinding({ ...base, clue: "different" }));
    expect(backupBinding(base)).not.toBe(backupBinding({ ...base, answer: "different" }));
    expect(backupBinding(base)).not.toBe(backupBinding({ ...base, commitment: "b".repeat(64) }));
  });
});
