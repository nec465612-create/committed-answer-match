// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeText, validateContractText } from "./contract";

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
