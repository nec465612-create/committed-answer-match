import {
  canonicalJson,
  isExactCaseRecord,
  type CaseRecord,
  type WriteMethod,
} from "./contract";

type ActionMethod = Exclude<WriteMethod, "create_match">;

const ACTION_METHODS: readonly ActionMethod[] = [
  "submit_guess",
  "reveal_answer",
  "evaluate_match",
  "retry_match",
  "expire_match",
];

function equal(left: unknown, right: unknown): boolean {
  try {
    return canonicalJson(left) === canonicalJson(right);
  } catch {
    return false;
  }
}

function decimal(value: unknown): value is string {
  return typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value);
}

function nextRevision(value: string): string {
  try {
    return (BigInt(value) + 1n).toString(10);
  } catch {
    return "";
  }
}

function exactOperation(record: CaseRecord, method: ActionMethod | "create_match", caller: string, argsHash: string): boolean {
  return equal(record.last_operation, { method, caller, args_hash: argsHash });
}

function sameImmutableState(before: CaseRecord, after: CaseRecord): boolean {
  return (
    isExactCaseRecord(before) &&
    isExactCaseRecord(after) &&
    after.id === before.id &&
    after.primary === before.primary &&
    after.secondary === before.secondary &&
    after.parent === before.parent &&
    after.create_hash === before.create_hash &&
    equal(after.base, before.base) &&
    after.base_locked === before.base_locked
  );
}

function sameResponse(before: CaseRecord, after: CaseRecord): boolean {
  return after.response_locked === before.response_locked && equal(after.response, before.response);
}

function sameAssessmentInputs(before: CaseRecord, after: CaseRecord): boolean {
  return (
    after.domain.nonce === before.domain.nonce &&
    after.domain.answer === before.domain.answer &&
    after.domain.salt === before.domain.salt &&
    after.domain.deadline === before.domain.deadline &&
    sameResponse(before, after) &&
    after.base_locked === before.base_locked
  );
}

function sameExpiryState(before: CaseRecord, after: CaseRecord): boolean {
  return (
    sameAssessmentInputs(before, after) &&
    after.accepted_attempts === before.accepted_attempts &&
    after.last_accepted_at === before.last_accepted_at &&
    equal(after.result, before.result)
  );
}

function validDeadlineAdvance(before: CaseRecord, after: CaseRecord): boolean {
  if (!decimal(after.domain.deadline)) return false;
  try {
    return BigInt(after.domain.deadline) >= BigInt(before.domain.deadline);
  } catch {
    return false;
  }
}

function validResult(record: CaseRecord): record is CaseRecord & { result: { v: 1; label: "MATCH" | "NO_MATCH" | "UNKNOWN" } } {
  return (
    typeof record.result === "object" &&
    record.result !== null &&
    Object.keys(record.result).length === 2 &&
    record.result.v === 1 &&
    (record.result.label === "MATCH" || record.result.label === "NO_MATCH" || record.result.label === "UNKNOWN")
  );
}

export function matchesCreatePostcondition(input: {
  record: CaseRecord;
  id: string;
  account: string;
  opponent: string;
  clue: string;
  nonce: string;
  commitment: string;
  argsHash: string;
}): boolean {
  const { record } = input;
  return (
    isExactCaseRecord(record) &&
    record.id === input.id &&
    record.primary === input.account &&
    record.secondary === input.opponent &&
    record.phase === "GUESS_OPEN" &&
    record.revision === "1" &&
    record.parent === "0" &&
    record.create_hash === input.argsHash &&
    equal(record.base, { clue: input.clue, commitment: input.commitment }) &&
    equal(record.response, {}) &&
    record.base_locked === true &&
    record.response_locked === false &&
    record.accepted_attempts === 0 &&
    record.last_accepted_at === "0" &&
    record.outcome === "" &&
    equal(record.result, {}) &&
    equal(record.domain, { nonce: input.nonce, answer: "", salt: "", deadline: record.domain.deadline }) &&
    decimal(record.domain.deadline) &&
    exactOperation(record, "create_match", input.account, input.argsHash)
  );
}

export function matchesActionPostcondition(input: {
  before: CaseRecord;
  after: CaseRecord;
  method: ActionMethod;
  caller: string;
  argsHash: string;
  args: readonly unknown[];
}): boolean {
  const { before, after, method, caller, argsHash, args } = input;
  if (!isExactCaseRecord(before) || !isExactCaseRecord(after) || !ACTION_METHODS.includes(method)) return false;
  if (!sameImmutableState(before, after) || !exactOperation(after, method, caller, argsHash)) return false;
  if (args[0] !== before.id || args[args.length - 1] !== before.revision) return false;

  if (method === "submit_guess") {
    const guess = args[1];
    return (
      typeof guess === "string" &&
      before.phase === "GUESS_OPEN" &&
      before.response_locked === false &&
      equal(before.response, {}) &&
      before.domain.answer === "" &&
      before.domain.salt === "" &&
      after.phase === "REVEAL_WAIT" &&
      after.revision === nextRevision(before.revision) &&
      after.response_locked === true &&
      equal(after.response, { guess }) &&
      after.domain.nonce === before.domain.nonce &&
      after.domain.answer === "" &&
      after.domain.salt === "" &&
      validDeadlineAdvance(before, after) &&
      after.accepted_attempts === 0 &&
      after.last_accepted_at === "0" &&
      after.outcome === "" &&
      equal(after.result, {})
    );
  }

  if (method === "reveal_answer") {
    const answer = args[1];
    const salt = args[2];
    return (
      typeof answer === "string" &&
      typeof salt === "string" &&
      before.phase === "REVEAL_WAIT" &&
      before.response_locked === true &&
      after.phase === "FROZEN" &&
      after.revision === nextRevision(before.revision) &&
      sameResponse(before, after) &&
      after.domain.nonce === before.domain.nonce &&
      after.domain.answer === answer &&
      after.domain.salt === salt &&
      validDeadlineAdvance(before, after) &&
      after.accepted_attempts === before.accepted_attempts &&
      after.last_accepted_at === before.last_accepted_at &&
      after.outcome === "" &&
      equal(after.result, {})
    );
  }

  if (method === "evaluate_match" || method === "retry_match") {
    const expectedBeforePhase = method === "evaluate_match" ? "FROZEN" : "UNRESOLVED";
    if (before.phase !== expectedBeforePhase || !sameAssessmentInputs(before, after)) return false;
    if (method === "evaluate_match" && before.accepted_attempts !== 0) return false;
    if (method === "retry_match" && (before.accepted_attempts < 1 || before.accepted_attempts >= 3)) return false;
    if (after.revision !== nextRevision(before.revision) || after.accepted_attempts !== before.accepted_attempts + 1 || !validResult(after)) return false;
    if (!decimal(after.last_accepted_at) || BigInt(after.last_accepted_at) <= BigInt(before.last_accepted_at)) return false;
    if (after.result.label === "MATCH" || after.result.label === "NO_MATCH") {
      return after.phase === "DONE" && after.outcome === after.result.label;
    }
    return after.outcome === "" && (after.accepted_attempts >= 3 ? after.phase === "EXHAUSTED" : after.phase === "UNRESOLVED");
  }

  return (
    before.phase !== "DONE" &&
    ["GUESS_OPEN", "REVEAL_WAIT", "FROZEN", "UNRESOLVED", "EXHAUSTED"].includes(before.phase) &&
    after.phase === "DONE" &&
    after.outcome === "VOID" &&
    after.revision === nextRevision(before.revision) &&
    sameExpiryState(before, after)
  );
}

export function matchesJournalActionPostcondition(input: {
  record: CaseRecord;
  method: ActionMethod;
  caller: string;
  argsHash: string;
  args: readonly unknown[];
  preRevision: string;
}): boolean {
  const { record, method, caller, argsHash, args, preRevision } = input;
  if (!isExactCaseRecord(record) || !ACTION_METHODS.includes(method)) return false;
  if (record.id !== args[0] || args[args.length - 1] !== preRevision || record.revision !== nextRevision(preRevision)) return false;
  if (!exactOperation(record, method, caller, argsHash)) return false;

  if (method === "submit_guess") {
    const guess = args[1];
    return (
      typeof guess === "string" &&
      record.phase === "REVEAL_WAIT" &&
      record.base_locked === true &&
      record.response_locked === true &&
      equal(record.response, { guess }) &&
      record.domain.answer === "" &&
      record.domain.salt === "" &&
      record.accepted_attempts === 0 &&
      record.last_accepted_at === "0" &&
      record.outcome === "" &&
      equal(record.result, {})
    );
  }

  if (method === "reveal_answer") {
    return (
      typeof args[1] === "string" &&
      typeof args[2] === "string" &&
      record.phase === "FROZEN" &&
      record.base_locked === true &&
      record.response_locked === true &&
      typeof record.response.guess === "string" &&
      record.domain.answer === args[1] &&
      record.domain.salt === args[2] &&
      record.accepted_attempts === 0 &&
      record.last_accepted_at === "0" &&
      record.outcome === "" &&
      equal(record.result, {})
    );
  }

  if (method === "expire_match") {
    return record.phase === "DONE" && record.outcome === "VOID" && record.base_locked === true;
  }

  if (!record.response_locked || typeof record.response.guess !== "string" || !validResult(record)) return false;
  if (!decimal(record.last_accepted_at) || record.last_accepted_at === "0") return false;
  if (method === "evaluate_match") {
    if (record.accepted_attempts !== 1) return false;
  } else if (method === "retry_match") {
    if (record.accepted_attempts !== 2 && record.accepted_attempts !== 3) return false;
  }
  if (record.result.label === "MATCH" || record.result.label === "NO_MATCH") {
    return record.phase === "DONE" && record.outcome === record.result.label;
  }
  return record.outcome === "" && (method === "evaluate_match" ? record.phase === "UNRESOLVED" : record.accepted_attempts === 3 ? record.phase === "EXHAUSTED" : record.phase === "UNRESOLVED");
}

export function backupBinding(input: {
  chain: string;
  contract: string;
  creator: string;
  opponent: string;
  nonce: string;
  clue: string;
  answer: string;
  salt: string;
  commitment: string;
}): string {
  return canonicalJson([
    input.chain,
    input.contract,
    input.creator,
    input.opponent,
    input.nonce,
    input.clue,
    input.answer,
    input.salt,
    input.commitment,
  ]);
}
