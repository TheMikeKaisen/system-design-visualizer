import { test, expect } from "@playwright/test";

test.describe("Canvas — core interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/canvas/resolve");
    // Wait for canvas to initialize
    await page.waitForSelector("[data-testid='canvas-root']", { timeout: 10_000 });
  });

  test("page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors.filter((e) => !e.includes("ResizeObserver"))).toHaveLength(0);
  });

  test("node palette is visible", async ({ page }) => {
    await expect(page.getByText("General")).toBeVisible();
    await expect(page.getByText("Amazon Web Services")).toBeVisible();
  });

  test("can drag a node from palette to canvas", async ({ page }) => {
    const palette    = page.getByRole("button", { name: /drag service/i });
    const canvasArea = page.locator("[data-testid='canvas-root']");

    const canvasBounds = await canvasArea.boundingBox();
    if (!canvasBounds) throw new Error("Canvas not found");

    // Drag node to center of canvas
    await palette.dragTo(canvasArea, {
      targetPosition: {
        x: canvasBounds.width / 2,
        y: canvasBounds.height / 2,
      },
    });

    // A node should now exist on the canvas
    await expect(page.locator(".react-flow__node")).toHaveCount(1);
  });

  test("undo removes a dropped node", async ({ page }) => {
    const palette    = page.getByRole("button", { name: /drag service/i });
    const canvasArea = page.locator("[data-testid='canvas-root']");
    const bounds     = await canvasArea.boundingBox();
    if (!bounds) throw new Error("Canvas not found");

    await palette.dragTo(canvasArea, {
      targetPosition: { x: bounds.width / 2, y: bounds.height / 2 },
    });
    await expect(page.locator(".react-flow__node")).toHaveCount(1);

    await page.keyboard.press("Control+z");
    await expect(page.locator(".react-flow__node")).toHaveCount(0);
  });

  test("simulation starts and stops", async ({ page }) => {
    await page.getByRole("button", { name: /start/i }).click();
    await expect(page.getByText("running")).toBeVisible();

    await page.getByRole("button", { name: /stop/i }).click();
    await expect(page.getByText("stopped")).toBeVisible();
  });

  test("diagram name is editable", async ({ page }) => {
    const nameInput = page.locator("input[aria-label='Diagram name']");
    await nameInput.clear();
    await nameInput.fill("My Test Diagram");
    await nameInput.press("Enter");

    await page.reload();
    await expect(page.locator("input[aria-label='Diagram name']")).toHaveValue(
      "My Test Diagram"
    );
  });
});
