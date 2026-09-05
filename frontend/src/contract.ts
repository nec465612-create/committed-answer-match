import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import {
  ExecutionResult,
  TransactionHashVariant,
  TransactionStatus,
} from "genlayer-js/types";
import type {
  Address as GenLayerAddress,
  CalldataEncodable,
  Hash as GenLayerHash,
} from "genlayer-js/types";
import type { ConnectedWallet } from "./wallet/connection";
import type { Eip1193Provider } from "./wallet/providers";

export const ZERO_HASH = "0".repeat(64);
export const WRITE_METHODS = [
  "create_match",
  "submit_guess",
  "reveal_answer",
  "evaluate_match",
  "retry_match",
  "expire_match",
] as const;
export type WriteMethod = (typeof WRITE_METHODS)[number];

export interface CaseRecord {
  v: 1;
  id: string;
  primary: string;
  secondary: string;
  phase: string;
  revision: string;
  parent: string;
  create_hash: string;
  base: { clue: string; commitment: string };
  response: Record<string, unknown>;
  base_locked: boolean;
  response_locked: boolean;
  accepted_attempts: number;
  last_accepted_at: string;
  outcome: string;
  result: Record<string, unknown>;
  domain: { nonce: string; answer: string; salt: string; deadline: string };
  last_operation: Record<string, unknown>;
}

export interface CaseRead {
  raw: string;
  record: CaseRecord;
}

export interface ContractReceipt {
  statusName?: string;
  txExecutionResultName?: string;
  hash?: string;
  txId?: string;
}

export interface ContractWriteAdapter {
  submit(method: WriteMethod, args: CalldataEncodable[]): Promise<string>;
  pollFinalized(hash: string): Promise<ContractReceipt | null>;
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const DECIMAL_RE = /^(0|[1-9][0-9]*)$/;
const NONCE_RE = /^[0-9a-f]{32}$/;
const HASH_RE = /^0x?[0-9a-fA-F]{64}$/;

export function normalizeAddress(value: unknown): string {
  if (typeof value !== "string" || !ADDRESS_RE.test(value)) {
    throw new Error("Invalid address.");
  }
  return value.toLowerCase();
}

export function normalizeText(value: unknown): string {
  if (typeof value !== "string") throw new Error("Text is required.");
  return value.replace(/\r\n/g, "\n");
}

function canonicalValue(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite JSON is not allowed.");
    return value;
  }
  if (typeof value === "bigint") throw new Error("BigInt must be rendered as a decimal string.");
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (typeof value === "object" && value !== null) {
    const object = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(object).sort()) result[key] = canonicalValue(object[key]);
    return result;
  }
  throw new Error("Unsupported JSON value.");
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomHex(bytes: number): string {
  if (!Number.isInteger(bytes) || bytes < 1) throw new Error("Invalid random byte count.");
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return [...buffer].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function computeCommitment(input: {
  creator: string;
  opponent: string;
  nonce: string;
  clue: string;
  answer: string;
  salt: string;
  chain?: string;
  contract?: string;
}): Promise<string> {
  const contract = input.contract ?? requireContractAddress();
  const preimage = [
    "ANSWER_MATCH_V1",
    input.chain ?? String(studionet.id),
    normalizeAddress(contract),
    normalizeAddress(input.creator),
    normalizeAddress(input.opponent),
    input.nonce,
    normalizeText(input.clue),
    normalizeText(input.answer),
    input.salt,
  ];
  return sha256Hex(canonicalJson(preimage));
}

export function requireContractAddress(): string {
  const value = import.meta.env.VITE_CONTRACT_ADDRESS?.trim().toLowerCase() ?? "";
  if (!ADDRESS_RE.test(value)) throw new Error("Contract is not configured.");
  return value;
}

function requireId(value: string): bigint {
  if (!DECIMAL_RE.test(value) || value === "0") throw new Error("Invalid case ID.");
  return BigInt(value);
}

function requireRevision(value: string): bigint {
  if (!DECIMAL_RE.test(value) || value === "0") throw new Error("Invalid revision.");
  return BigInt(value);
}

function requireNonce(value: string): string {
  if (!NONCE_RE.test(value)) throw new Error("Invalid nonce.");
  return value;
}

function parseCase(raw: unknown): CaseRead {
  if (typeof raw !== "string" || raw === "null") throw new Error("Case not found.");
  const record = JSON.parse(raw) as CaseRecord;
  if (!record || typeof record !== "object" || record.v !== 1) throw new Error("Invalid case response.");
  return { raw, record };
}

const readClient = createClient({ chain: studionet });

async function readValue(functionName: string, args: CalldataEncodable[]): Promise<unknown> {
  return readClient.readContract({
    address: requireContractAddress() as GenLayerAddress,
    functionName,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
}

export async function readCase(caseId: string): Promise<CaseRead> {
  const raw = await readValue("get_case", [requireId(caseId)]);
  return parseCase(raw);
}

export async function readVersion(caseId: string, revision: string): Promise<string | null> {
  const raw = await readValue("get_version", [requireId(caseId), requireRevision(revision)]);
  if (raw === "null") return null;
  if (typeof raw !== "string") throw new Error("Invalid history response.");
  return raw;
}

export async function readIdByNonce(creator: string, nonce: string): Promise<string> {
  const value = await readValue("get_id_by_nonce", [normalizeAddress(creator) as GenLayerAddress, requireNonce(nonce)]);
  if (typeof value === "bigint") return value.toString(10);
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) return String(value);
  if (typeof value === "string" && DECIMAL_RE.test(value)) return value;
  throw new Error("Invalid nonce lookup response.");
}

export function parseRecord(raw: string): CaseRecord | null {
  if (raw === "null") return null;
  const parsed = JSON.parse(raw) as CaseRecord;
  if (!parsed || typeof parsed !== "object" || parsed.v !== 1) return null;
  return parsed;
}

export function makeWriteAdapter(wallet: ConnectedWallet): ContractWriteAdapter {
  const address = requireContractAddress() as GenLayerAddress;
  const provider = wallet.provider as Eip1193Provider;
  const client = createClient({
    chain: studionet,
    account: wallet.account as GenLayerAddress,
    provider,
  });
  return {
    async submit(method, args) {
      const hash = await client.writeContract({
        address,
        functionName: method,
        args,
        value: 0n,
        consensusMaxRotations: 3,
      });
      if (typeof hash !== "string" || !HASH_RE.test(hash)) throw new Error("Wallet did not return a transaction hash.");
      return hash.toLowerCase().startsWith("0x") ? hash.toLowerCase() : `0x${hash.toLowerCase()}`;
    },
    async pollFinalized(hash) {
      try {
        const receipt = await client.waitForTransactionReceipt({
          hash: hash as unknown as GenLayerHash,
          status: TransactionStatus.FINALIZED,
          retries: 0,
        });
        return {
          statusName: receipt.statusName,
          txExecutionResultName: receipt.txExecutionResultName,
          hash: receipt.hash,
          txId: receipt.txId,
        };
      } catch {
        return null;
      }
    },
  };
}

export function isSuccessfulReceipt(receipt: ContractReceipt): boolean {
  return (
    receipt.statusName === TransactionStatus.FINALIZED &&
    receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_RETURN
  );
}

export function chainIdDecimal(): string {
  return String(studionet.id);
}
