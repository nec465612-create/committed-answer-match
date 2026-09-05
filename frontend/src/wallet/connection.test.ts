// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { connectWallet } from "./connection";
import type { WalletCandidate } from "./providers";

const ACCOUNT = "0x1111111111111111111111111111111111111111";

function candidate(request: WalletCandidate["provider"]) {
  return {
    id: "metamask",
    name: "MetaMask",
    provider: request,
    source: "eip6963" as const,
  } satisfies WalletCandidate;
}

describe("connectWallet", () => {
  it("binds session listeners to the selected provider and removes them on cleanup", async () => {
    const listeners = new Map<string, (...args: unknown[]) => void>();
    const removed: string[] = [];
    const reload = vi.fn();
    const provider = {
      request: vi.fn(async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts") return [ACCOUNT];
        if (method === "eth_chainId") return "0xf22f";
        return [];
      }),
      on: vi.fn((event: string, listener: (...args: unknown[]) => void) => listeners.set(event, listener)),
      removeListener: vi.fn((event: string) => { removed.push(event); listeners.delete(event); }),
    };

    const connected = await connectWallet(candidate(provider), { reload });
    expect(connected.account).toBe(ACCOUNT);
    expect(provider.request).toHaveBeenCalledTimes(2);

    listeners.get("accountsChanged")?.([ACCOUNT]);
    expect(reload).not.toHaveBeenCalled();
    listeners.get("accountsChanged")?.(["0x2222222222222222222222222222222222222222"]);
    listeners.get("chainChanged")?.("0x1");
    listeners.get("disconnect")?.();
    expect(reload).toHaveBeenCalledTimes(3);

    connected.cleanup();
    expect(removed).toEqual(["accountsChanged", "chainChanged", "disconnect"]);
  });

  it("adds an unknown chain and retries the switch on the selected provider only", async () => {
    let switchAttempts = 0;
    const methods: string[] = [];
    const provider = {
      request: vi.fn(async ({ method }: { method: string }) => {
        methods.push(method);
        if (method === "eth_requestAccounts") return [ACCOUNT];
        if (method === "eth_chainId") return "0x1";
        if (method === "wallet_switchEthereumChain" && switchAttempts++ === 0) {
          throw Object.assign(new Error("chain not added"), { code: 4902 });
        }
        return [];
      }),
    };

    const connected = await connectWallet(candidate(provider), { reload: vi.fn() });
    expect(connected.account).toBe(ACCOUNT);
    expect(methods).toEqual([
      "eth_requestAccounts",
      "eth_chainId",
      "wallet_switchEthereumChain",
      "wallet_addEthereumChain",
      "wallet_switchEthereumChain",
    ]);
    connected.cleanup();
  });
});
