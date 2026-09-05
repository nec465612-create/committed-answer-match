// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeText, parseTransactionReceipt, parseTransactionStatus, validateContractText } from "./contract";

describe("read request safeguards", () => {
  it("normalizes CRLF before a reveal is hashed or submitted", () => {
    expect(normalizeText("correct\r\nreference")).toBe("correct\nreference");
  });

  it("matches the contract byte and control-character boundary", () => {
    expect(validateContractText("line\r\nnext\tvalue", 64)).toBe("line\nnext\tvalue");
    expect(() => validateContractText("é".repeat(257), 512)).toThrow();
    expect(() => validateContractText("a".repeat(513), 512)).toThrow();
    expect(() => validateContractText("bad\u0000text", 512)).toThrow();
    expect(() => validateContractText("", 512)).toThrow();
    expect(validateContractText("", 256, true)).toBe("");
  });

  it("rejects unpaired UTF-16 surrogates before a wallet request", () => {
    expect(() => validateContractText("high\ud800", 512)).toThrow();
    expect(() => validateContractText("low\udc00", 512)).toThrow();
    expect(validateContractText("paired\ud83d\ude00", 512)).toBe("paired\ud83d\ude00");
  });
});

describe("transaction receipt parsing", () => {
  it("accepts the direct GenLayer receipt shape without the legacy SDK lookup", () => {
    expect(parseTransactionReceipt({
      id: "0x" + "a".repeat(64),
      status: 7,
      statusName: "Finalized",
      txExecutionResult: 1,
      txExecutionResultName: "FinishedWithReturn",
    })).toMatchObject({
      statusName: "FINALIZED",
      txExecutionResultName: "FINISHED_WITH_RETURN",
      txId: "0x" + "a".repeat(64),
      hash: "0x" + "a".repeat(64),
    });
  });

  it("does not treat a non-final receipt as terminal", () => {
    expect(parseTransactionReceipt({ status: 5, statusName: "Accepted" })).toBeNull();
  });

  it("accepts the legacy explorer execution aliases", () => {
    expect(parseTransactionReceipt({ status: "FINALIZED", resultName: "SUCCESS" })).toMatchObject({
      statusName: "FINALIZED",
      txExecutionResultName: "FINISHED_WITH_RETURN",
    });
    expect(parseTransactionReceipt({ status: "FINALIZED", txExecutionResultName: "Return" })).toMatchObject({
      txExecutionResultName: "FINISHED_WITH_RETURN",
    });
    expect(parseTransactionReceipt({ status: "FINALIZED", data: { resultName: "SUCCESS" } })).toMatchObject({
      txExecutionResultName: "FINISHED_WITH_RETURN",
    });
    expect(parseTransactionReceipt({ status: "FINALIZED", consensus_data: { leader_receipt: [{ execution_result: "Return" }] } })).toMatchObject({
      txExecutionResultName: "FINISHED_WITH_RETURN",
    });
  });
});

describe("transaction status parsing", () => {
  it("accepts both legacy primitive and documented object responses", () => {
    expect(parseTransactionStatus("Finalized")).toBe("FINALIZED");
    expect(parseTransactionStatus({ status: "Finalized", statusCode: 7 })).toBe("FINALIZED");
  });
});
