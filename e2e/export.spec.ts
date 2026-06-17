import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/canvas/resolve");
    await page.waitForSelector("[data-testid='canvas-root']", { timeout: 10_000 });
  });

  test("export JSON triggers a download", async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /share/i }).click().then(async () => {
        await page.getByText("Export as JSON").click();
      }),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.sysvis\.json$/);
  });

  test("copy link shows copied feedback", async ({ page }) => {
    await page.getByRole("button", { name: /share/i }).click();
    await page.getByText("Copy link").click();
    await expect(page.getByText("Link copied!")).toBeVisible();
  });
});
