import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Phase 2 — Discovery Feed E2E & Accessibility Tests
 *
 * Covers:
 *  - Feed page renders with header controls and item cards
 *  - Variety, Free/Paid, Upcoming, Local, Hide Thumbnails toggles
 *  - Zero image requests when thumbnails_hidden is enabled (Rule D6)
 *  - No undeclared third-party network requests (Rule 6)
 *  - /api/feed never returns ads (Rule 17 — network-level assertion)
 *  - WCAG 2.2 AA accessibility on the feed page
 */

test.describe("Discovery Feed (Phase 2)", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept feed API to inject stub items so tests don't depend on seed data availability
    await page.route("/api/feed**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "stub-item-1",
              title: "Introduction to Rust",
              url: "https://example.com/rust",
              sourceName: "The Pragmatic Programmer",
              description: "A fast systems programming language.",
              thumbnailUrl: "https://example.com/rust-thumb.jpg",
              categoryId: "cat-learn",
              subcategoryId: "sub-learn-programming",
              topicId: "topic-learn-programming-rust",
              category: { id: "cat-learn", slug: "learn", name: "Learn" },
              subcategory: {
                id: "sub-learn-programming",
                slug: "learn-programming",
                name: "Programming",
              },
              topic: {
                id: "topic-learn-programming-rust",
                slug: "learn-programming-rust",
                name: "Rust",
              },
              cost: "FREE",
              startsAt: null,
              endsAt: null,
              timezone: null,
              region: null,
              popularityCount: 42,
              isSaved: false,
              score: 1.5,
            },
            {
              id: "stub-item-2",
              title: "City Jazz Night",
              url: "https://example.com/jazz",
              sourceName: "Local Events",
              description: "Live jazz in the city centre.",
              thumbnailUrl: "https://example.com/jazz-thumb.jpg",
              categoryId: "cat-attend",
              subcategoryId: "sub-attend-music",
              topicId: "topic-attend-music-jazz",
              category: {
                id: "cat-attend",
                slug: "attend-and-experience",
                name: "Attend & Experience",
              },
              subcategory: { id: "sub-attend-music", slug: "attend-music", name: "Music" },
              topic: {
                id: "topic-attend-music-jazz",
                slug: "attend-music-jazz",
                name: "Jazz",
              },
              cost: "PAID",
              startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              endsAt: null,
              timezone: "Europe/London",
              region: "GB",
              popularityCount: 10,
              isSaved: false,
              score: 1.2,
            },
          ],
          nextCursor: null,
          recycled: false,
        }),
      });
    });
  });

  test("renders feed header with category chips, Variety, and toggles", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    // Variety chip
    const varietyChip = page.getByRole("button", { name: /variety/i });
    await expect(varietyChip).toBeVisible();
    await expect(varietyChip).toHaveAttribute("aria-pressed", "false");

    // At least one category chip
    const readChip = page.getByRole("button", { name: /read/i });
    await expect(readChip).toBeVisible();

    // Free / Paid toggles
    await expect(page.getByRole("button", { name: /free/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /paid/i })).toBeVisible();

    // Upcoming and Local toggles
    await expect(page.getByRole("button", { name: /upcoming/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /local/i })).toBeVisible();

    // Hide thumbnails toggle
    await expect(page.getByRole("button", { name: /hide thumbnails/i })).toBeVisible();
  });

  test("renders feed item cards with title, source, and Open link", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Introduction to Rust")).toBeVisible();
    await expect(page.getByText("The Pragmatic Programmer")).toBeVisible();

    // Open link opens in new tab with noopener noreferrer
    const openLink = page.getByRole("link", { name: /open "Introduction to Rust"/i });
    await expect(openLink).toHaveAttribute("target", "_blank");
    await expect(openLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("displays Upcoming badge and Add to Calendar for future-dated items", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    // "City Jazz Night" has a future startsAt so it should show Add to Calendar
    await expect(
      page.getByRole("button", { name: /add "City Jazz Night" to Calendar/i }),
    ).toBeVisible();

    // "Introduction to Rust" has no date — Add to Calendar should NOT be visible
    await expect(
      page.getByRole("button", { name: /add "Introduction to Rust" to Calendar/i }),
    ).not.toBeVisible();
  });

  test("Variety chip toggles aria-pressed state", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    const varietyChip = page.getByRole("button", { name: /variety/i });
    await expect(varietyChip).toHaveAttribute("aria-pressed", "false");
    await varietyChip.click();
    await expect(varietyChip).toHaveAttribute("aria-pressed", "true");
  });

  test("toggling a category chip updates aria-pressed and reloads feed", async ({ page }) => {
    let feedRequestCount = 0;
    await page.route("/api/feed**", async (route) => {
      feedRequestCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], nextCursor: null, recycled: false }),
      });
    });

    await page.goto("/feed");
    await page.waitForLoadState("networkidle");
    const initialCount = feedRequestCount;

    const readChip = page.getByRole("button", { name: "Read" });
    await readChip.click();
    await expect(readChip).toHaveAttribute("aria-pressed", "true");
    expect(feedRequestCount).toBeGreaterThan(initialCount);
  });

  test("empty state shows Clear filters button", async ({ page }) => {
    await page.route("/api/feed**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], nextCursor: null, recycled: false }),
      });
    });

    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: /clear filters/i })).toBeVisible();
    await expect(page.getByText(/no items match your active filters/i)).toBeVisible();
  });

  test("Save button toggles aria-pressed and fires POST /api/items/:id/save", async ({ page }) => {
    let saveCalled = false;
    await page.route("/api/items/stub-item-1/save", async (route) => {
      saveCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ saved: true, itemId: "stub-item-1" }),
      });
    });

    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    const saveBtn = page.getByRole("button", {
      name: /save "Introduction to Rust" to Catalogues/i,
    });
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toHaveAttribute("aria-pressed", "false");

    await saveBtn.click();
    expect(saveCalled).toBe(true);
    await expect(saveBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("Not interested button fires POST /api/items/:id/dismiss and removes item", async ({
    page,
  }) => {
    let dismissCalled = false;
    await page.route("/api/items/stub-item-1/dismiss", async (route) => {
      dismissCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ dismissed: true, itemId: "stub-item-1" }),
      });
    });

    await page.goto("/feed");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Introduction to Rust")).toBeVisible();

    const dismissBtn = page.getByRole("button", {
      name: /don't show "Introduction to Rust" again/i,
    });
    await dismissBtn.click();
    expect(dismissCalled).toBe(true);

    // Item should be removed from view
    await expect(page.getByText("Introduction to Rust")).not.toBeVisible();
  });

  test("Hide thumbnails: zero image network requests when enabled (D6)", async ({ page }) => {
    const imageRequests: string[] = [];

    // Intercept ALL requests and log image ones
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      const url = req.url();
      if (resourceType === "image" && !url.includes("localhost")) {
        imageRequests.push(url);
      }
    });

    // Enable thumbnails_hidden via localStorage before page load
    await page.addInitScript(() => {
      const store = {
        state: { thumbnailsHidden: true },
        version: 0,
      };
      localStorage.setItem("ui-store", JSON.stringify(store));
    });

    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    // The hide-thumbnails toggle should show as active
    const toggle = page.getByRole("button", { name: /show thumbnails/i });
    await expect(toggle).toBeVisible();

    // No external image requests should have been made for item thumbnails
    const externalImageRequests = imageRequests.filter(
      (url) => url.includes("example.com") && url.includes("thumb"),
    );
    expect(externalImageRequests).toHaveLength(0);
  });

  test("Rule 17: /api/feed response contains no ad items", async ({ page }) => {
    // Restore actual feed route (remove stub)
    await page.unroute("/api/feed**");

    const feedResponses: Array<{ items: Array<{ id: string }> }> = [];

    page.on("response", async (response) => {
      if (response.url().includes("/api/feed") && response.status() === 200) {
        try {
          const json = await response.json();
          feedResponses.push(json);
        } catch {
          // ignore
        }
      }
    });

    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    // Verify every item in every feed response has no ad-type fields
    for (const feedResponse of feedResponses) {
      if (feedResponse.items) {
        for (const item of feedResponse.items) {
          expect((item as Record<string, unknown>).type).not.toBe("AD");
          expect((item as Record<string, unknown>).adId).toBeUndefined();
          expect((item as Record<string, unknown>).advertiser).toBeUndefined();
        }
      }
    }
  });

  test("Rule 6: no undeclared third-party network requests", async ({ page }) => {
    const thirdPartyRequests: string[] = [];

    page.on("request", (req) => {
      const url = new URL(req.url());
      const allowedHosts = ["localhost", "127.0.0.1"];
      if (!allowedHosts.some((host) => url.hostname.includes(host))) {
        thirdPartyRequests.push(req.url());
      }
    });

    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    expect(
      thirdPartyRequests,
      `Undeclared third-party requests detected: ${thirdPartyRequests.join(", ")}`,
    ).toHaveLength(0);
  });

  test("feed page passes WCAG 2.2 AA accessibility audit", async ({ page }) => {
    await page.goto("/feed");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
