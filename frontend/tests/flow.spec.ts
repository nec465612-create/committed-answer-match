import { expect, test } from "@playwright/test";

test("opens a real provider picker without requesting an account on page load", async ({ page }) => {
  await page.addInitScript(() => {
    const calls: string[] = [];
    const provider = {
      request: async ({ method }: { method: string }) => {
        calls.push(method);
        if (method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
        if (method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
        if (method === "eth_chainId") return "0xf22f";
        return [];
      },
    };
    (window as Window & { __walletCalls?: string[] }).__walletCalls = calls;
    window.addEventListener("eip6963:requestProvider", () => {
      window.dispatchEvent(new CustomEvent("eip6963:announceProvider", {
        detail: {
          info: { uuid: "e2e-metamask", name: "MetaMask", icon: "data:", rdns: "io.metamask" },
          provider,
        },
      }));
    });
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: /connect wallet/i })).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __walletCalls?: string[] }).__walletCalls)).toEqual([]);

  await page.getByRole("button", { name: /connect wallet/i }).click();
  await expect(page.getByRole("dialog")).toContainText("MetaMask");
  await expect(page.getByRole("dialog")).not.toContainText("OKX Wallet");
  await expect(page.getByRole("dialog")).not.toContainText("Rabby");
  expect(await page.evaluate(() => (window as Window & { __walletCalls?: string[] }).__walletCalls)).toEqual([]);

  await page.getByTestId("wallet-option-metamask").click();
  await expect(page.getByRole("button", { name: /0x1111/i })).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __walletCalls?: string[] }).__walletCalls)).toEqual([
    "eth_requestAccounts",
    "eth_accounts",
    "eth_chainId",
  ]);
});

test("accepts a wallet provider announced after the app has mounted", async ({ page }) => {
  await page.addInitScript(() => {
    const provider = {
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
        if (method === "eth_accounts") return ["0x1111111111111111111111111111111111111111"];
        if (method === "eth_chainId") return "0xf22f";
        return [];
      },
    };
    (window as Window & { __announceLate?: () => void }).__announceLate = () => {
      window.dispatchEvent(new CustomEvent("eip6963:announceProvider", {
        detail: {
          info: { uuid: "late-metamask", name: "MetaMask", icon: "data:", rdns: "io.metamask" },
          provider,
        },
      }));
    };
  });

  await page.goto("/");
  await page.getByRole("button", { name: /connect wallet/i }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("No supported wallet was detected yet.");
  await page.evaluate(() => (window as Window & { __announceLate?: () => void }).__announceLate?.());
  await expect(dialog.locator('[data-testid="wallet-option-metamask"]')).toHaveCount(1);
});

test("keeps the journal lock failure visible instead of attempting a write", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await expect(page.getByText(/journal lock/i)).toBeVisible();
});

test("disables every signing control when the journal is not lockable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "locks", { configurable: true, value: undefined });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "New match", exact: true }).click();
  await expect(page.getByRole("button", { name: /Create match/ })).toBeDisabled();
});

test("renders every valid journal record and preserves malformed raw export", async ({ page }) => {
  await page.addInitScript(() => {
    const contract = "0x1111111111111111111111111111111111111111";
    const account = "0x2222222222222222222222222222222222222222";
    for (let index = 1; index <= 5; index += 1) {
      const nonce = index.toString(16).padStart(32, "0");
      const reservation = index.toString(16).padStart(32, "0");
      const record = {
        v: 1,
        reservation,
        chain: "61999",
        contract,
        account,
        method: "create_match",
        intent: `create:${account}:${nonce}`,
        args_json: JSON.stringify([nonce, contract, `clue ${index}`, "a".repeat(64)]),
        pre_revision: "0",
        pre_hash: "0".repeat(64),
        pre_state_json: "",
        tx_hash: "",
        status: "RECONCILE",
        created_ms: String(index),
        resolution_json: "{}",
      };
      localStorage.setItem(`glj1:${reservation}`, JSON.stringify(record));
    }
    localStorage.setItem("glj1:malformed", "{not-json");
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await expect(page.locator(".journal-row")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Previous journal page" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Next journal page" })).toBeEnabled();
  await page.getByRole("button", { name: "Next journal page" }).click();
  await expect(page.locator(".journal-row")).toHaveCount(2);
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await expect(page.getByText("Unreadable journal entry")).toBeVisible();
  await expect(page.getByText(/Unreadable journal entries are preserved/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Export" })).toBeEnabled();
});

test("keeps a submitted hash and safe reconciliation visible after reload", async ({ page }) => {
  const hash = "0x" + "d".repeat(64);
  await page.addInitScript((txHash) => {
    const reservation = "f".repeat(32);
    const record = {
      v: 1,
      reservation,
      chain: "61999",
      contract: "0x1111111111111111111111111111111111111111",
      account: "0x2222222222222222222222222222222222222222",
      method: "evaluate_match",
      intent: "evaluate_match:1:3",
      args_json: "[\"1\",\"3\"]",
      pre_revision: "3",
      pre_hash: "a".repeat(64),
      pre_state_json: "",
      tx_hash: txHash,
      status: "SUBMITTED",
      created_ms: "1",
      resolution_json: "{}",
    };
    localStorage.setItem(`glj1:${reservation}`, JSON.stringify(record));
    (window as Window & { __walletCalls?: string[] }).__walletCalls = [];
  }, hash);

  await page.goto("/");
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  const row = page.locator(".journal-row").filter({ hasText: "Awaiting finality" });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(hash);
  await expect(row.getByRole("button", { name: "Copy transaction hash for Evaluate match" })).toBeVisible();
  await expect(row.getByRole("link", { name: "Open transaction in Explorer for Evaluate match" })).toHaveAttribute("href", `https://explorer-studio.genlayer.com/tx/${hash}`);
  await expect(row.getByRole("button", { name: "Reconcile Evaluate match" })).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __walletCalls?: string[] }).__walletCalls)).toEqual([]);

  await page.reload();
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  const reloadedRow = page.locator(".journal-row").filter({ hasText: "Awaiting finality" });
  await expect(reloadedRow).toContainText(hash);
  await expect(reloadedRow.getByRole("button", { name: "Copy transaction hash for Evaluate match" })).toBeVisible();
  await expect(reloadedRow.getByRole("button", { name: "Reconcile Evaluate match" })).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __walletCalls?: string[] }).__walletCalls)).toEqual([]);
});

test("shows an empty picker without fake wallet options and restores focus on Escape", async ({ page }) => {
  await page.goto("/");
  const connect = page.getByRole("button", { name: /connect wallet/i });
  await connect.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("No supported wallet was detected yet.");
  await expect(dialog.locator('[data-testid^="wallet-option-"]')).toHaveCount(0);
  await expect(page.locator(".app-page")).toHaveAttribute("inert", "");
  await expect(page.getByRole("button", { name: "Close wallet picker" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(connect).toBeFocused();
});
