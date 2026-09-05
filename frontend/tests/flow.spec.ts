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
