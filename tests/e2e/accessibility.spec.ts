import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("App Shell & WCAG 2.2 AA Accessibility", () => {
  test("feed home page passes WCAG 2.2 AA accessibility audit", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("skip-to-content accessibility link works correctly", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.locator("a[href='#main-content']");
    await expect(skipLink).toBeAttached();

    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
  });

  test("watch-ads returns 404 when FEATURE_WATCH_ADS_ENABLED is false (D23)", async ({
    page,
  }) => {
    const response = await page.goto("/watch-ads");
    expect(response?.status()).toBe(404);
  });
});
