import { expect, test } from "@playwright/test";

test("opens a real provider picker without requesting an account on page load", async ({ page }) => {
  await page.addInitScript(() => {
    const calls: string[] = [];
    const provider = {
      request: async ({ method }: { method: string }) => {
        calls.push(method);
        if (method === "eth_requestAccounts") return ["0x1111111111111111111111111111111111111111"];
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
    "eth_chainId",
  ]);
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
  await expect(page.locator(".journal-row")).toHaveCount(6);
  await expect(page.getByText(/Unreadable journal entries are preserved/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Export" })).toBeEnabled();
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
