import { test, expect } from "@playwright/test";

/**
 * Phase 3 — Offline Read-Only Cache E2E Tests
 *
 * Verifies the Serwist service worker caches /catalogues and /calendar pages
 * plus their API responses so both remain readable offline in read-only mode
 * (`Section 10`, `8.3`, `8.4`).
 */

async function waitForServiceWorker(page: import("@playwright/test").Page) {
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, {
    timeout: 15000,
  });
}

test.describe("Offline Read-Only Cache (Phase 3)", () => {
  test("My Catalogues page is readable offline", async ({ context, page }) => {
    await page.goto("/catalogues");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /My Catalogues/ })).toBeVisible();

    // Confirm the service worker has taken control before going offline
    await waitForServiceWorker(page);

    // Warm the SW cache with one SW-controlled online reload so the page
    // and its API responses are cached for offline read-only viewing
    await page.reload({ waitUntil: "networkidle" });

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /My Catalogues/ })).toBeVisible();

    await context.setOffline(false);
  });

  test("Calendar page is readable offline", async ({ context, page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Calendar/ })).toBeVisible();

    await waitForServiceWorker(page);

    // Warm the SW cache with one SW-controlled online reload
    await page.reload({ waitUntil: "networkidle" });

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Calendar/ })).toBeVisible();

    await context.setOffline(false);
  });
});
