// @vitest-environment node
import { describe, expect, it } from "vitest";
import { dedupeInFlight, normalizeText, validateContractText } from "./contract";

describe("read request safeguards", () => {
  it("deduplicates identical in-flight reads and releases the key after settlement", async () => {
    const inFlight = new Map<string, Promise<number>>();
    let calls = 0;
    let resolveRead: ((value: number) => void) | undefined;
    const run = () => {
      calls += 1;
      return new Promise<number>((resolve) => { resolveRead = resolve; });
    };
    const first = dedupeInFlight(inFlight, "61999:contract:get_case:1", run);
    const second = dedupeInFlight(inFlight, "61999:contract:get_case:1", run);
    expect(first).toBe(second);
    expect(calls).toBe(1);
    resolveRead?.(1);
    await expect(first).resolves.toBe(1);
    await expect(dedupeInFlight(inFlight, "61999:contract:get_case:1", async () => { calls += 1; return 2; })).resolves.toBe(2);
    expect(calls).toBe(2);
  });

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
});
