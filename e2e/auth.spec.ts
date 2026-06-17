import { test, expect } from "@playwright/test";

test.describe("Auth — unauthenticated access", () => {
  test("canvas route redirects to sign-in when auth is enabled", async ({ page }) => {
    // Only meaningful when DATABASE_URL is set — skip otherwise
    test.skip(
      !process.env.DATABASE_URL,
      "Auth redirect only active with DATABASE_URL"
    );

    await page.goto("/canvas/some-diagram-id");
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test("sign-in page is accessible", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await expect(page.getByText("Sign in")).toBeVisible();
  });
});
