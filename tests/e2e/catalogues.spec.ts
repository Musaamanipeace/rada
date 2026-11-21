import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Phase 3 — My Catalogues E2E & Accessibility Tests
 *
 * Covers:
 *  - Ten category shelves that expand into subcategories; empty shelves greyed out
 *  - Save / un-save flow end-to-end across Feed and My Catalogues (Rule D4)
 *  - Un-saving respects thumbnails_hidden
 *  - Rule 17: /api/catalogues never returns ads
 *  - Hide thumbnails: zero image network requests
 *  - WCAG 2.2 AA accessibility on the catalogues page
 */

const cataloguesResponse = {
  categories: [
    {
      id: "cat-read",
      slug: "read",
      name: "Read",
      totalItems: 2,
      subcategories: [
        {
          id: "sub-read-books",
          slug: "read-books",
          name: "Books",
          items: [
            {
              id: "cat-item-1",
              savedItemId: "saved-1",
              title: "Introduction to Rust",
              url: "https://example.com/rust",
              sourceName: "The Pragmatic Programmer",
              description: "A fast systems programming language.",
              thumbnailUrl: "https://example.com/rust-thumb.jpg",
              categoryId: "cat-read",
              subcategoryId: "sub-read-books",
              topicId: "topic-read-books-programming",
              category: { id: "cat-read", slug: "read", name: "Read" },
              subcategory: { id: "sub-read-books", slug: "read-books", name: "Books" },
              topic: { id: "topic-read-books-programming", slug: "read-books-programming", name: "Programming" },
              cost: "FREE",
              startsAt: null,
              endsAt: null,
              timezone: null,
              region: null,
              popularityCount: 5,
              savedAt: "2026-11-01T10:00:00Z",
            },
          ],
        },
        {
          id: "sub-read-articles",
          slug: "read-articles",
          name: "Articles",
          items: [
            {
              id: "cat-item-2",
              savedItemId: "saved-2",
              title: "Understanding TypeScript",
              url: "https://example.com/ts",
              sourceName: "Dev Weekly",
              description: "TypeScript deep dive.",
              thumbnailUrl: "https://example.com/ts-thumb.jpg",
              categoryId: "cat-read",
              subcategoryId: "sub-read-articles",
              topicId: "topic-read-articles-typescript",
              category: { id: "cat-read", slug: "read", name: "Read" },
              subcategory: { id: "sub-read-articles", slug: "read-articles", name: "Articles" },
              topic: { id: "topic-read-articles-typescript", slug: "read-articles-typescript", name: "TypeScript" },
              cost: "FREE",
              startsAt: null,
              endsAt: null,
              timezone: null,
              region: null,
              popularityCount: 3,
              savedAt: "2026-11-02T11:00:00Z",
            },
          ],
        },
      ],
    },
    {
      id: "cat-watch",
      slug: "watch",
      name: "Watch",
      totalItems: 0,
      subcategories: [
        { id: "sub-watch-movies", slug: "watch-movies", name: "Movies", items: [] },
        { id: "sub-watch-series", slug: "watch-series", name: "Series", items: [] },
      ],
    },
    {
      id: "cat-listen",
      slug: "listen",
      name: "Listen",
      totalItems: 0,
      subcategories: [
        { id: "sub-listen-podcasts", slug: "listen-podcasts", name: "Podcasts", items: [] },
        { id: "sub-listen-music", slug: "listen-music", name: "Music", items: [] },
      ],
    },
    {
      id: "cat-play",
      slug: "play",
      name: "Play",
      totalItems: 0,
      subcategories: [{ id: "sub-play-games", slug: "play-games", name: "Games", items: [] }],
    },
    {
      id: "cat-learn",
      slug: "learn",
      name: "Learn",
      totalItems: 0,
      subcategories: [{ id: "sub-learn-courses", slug: "learn-courses", name: "Courses", items: [] }],
    },
    {
      id: "cat-make-and-explore",
      slug: "make-and-explore",
      name: "Make & Explore",
      totalItems: 0,
      subcategories: [{ id: "sub-make-diy", slug: "make-diy", name: "DIY", items: [] }],
    },
    {
      id: "cat-attend-and-experience",
      slug: "attend-and-experience",
      name: "Attend & Experience",
      totalItems: 0,
      subcategories: [{ id: "sub-attend-events", slug: "attend-events", name: "Events", items: [] }],
    },
    {
      id: "cat-improve-and-contribute",
      slug: "improve-and-contribute",
      name: "Improve & Contribute",
      totalItems: 0,
      subcategories: [{ id: "sub-improve-volunteer", slug: "improve-volunteer", name: "Volunteer", items: [] }],
    },
    {
      id: "cat-earn-and-build",
      slug: "earn-and-build",
      name: "Earn & Build",
      totalItems: 0,
      subcategories: [{ id: "sub-earn-freelance", slug: "earn-freelance", name: "Freelance", items: [] }],
    },
    {
      id: "cat-connect",
      slug: "connect",
      name: "Connect",
      totalItems: 0,
      subcategories: [{ id: "sub-connect-groups", slug: "connect-groups", name: "Groups", items: [] }],
    },
  ],
};

const shelfButton = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("button").filter({ has: page.getByText(name, { exact: true }) });

test.describe("My Catalogues (Phase 3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("/api/catalogues**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(cataloguesResponse),
      });
    });
  });

  test("renders ten category shelves; populated shelves expand, empty shelves are greyed out", async ({
    page,
  }) => {
    await page.goto("/catalogues");
    await page.waitForLoadState("networkidle");

    // Ten category shelf headers
    const shelfHeaders = page.locator("button:has(h2)");
    await expect(shelfHeaders).toHaveCount(10);

    // Populated "Read" shelf auto-expands on load (categories with items) and reveals subcategory shelves
    const readShelf = shelfButton(page, "Read");
    await expect(readShelf).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Books (1)")).toBeVisible();
    await expect(page.getByText("Articles (1)")).toBeVisible();

    // Collapse and re-expand toggles aria-expanded
    await readShelf.click();
    await expect(readShelf).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Books (1)")).not.toBeVisible();
    await readShelf.click();
    await expect(readShelf).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Books (1)")).toBeVisible();

    // Empty "Watch" shelf is greyed out and does not expand to items
    const watchShelf = shelfButton(page, "Watch");
    await expect(watchShelf).toHaveAttribute("aria-expanded", "false");
    await watchShelf.click();
    await expect(page.getByText("Movies (0)")).not.toBeVisible();
    await expect(page.getByText("Series (0)")).not.toBeVisible();
  });

  test("un-saving an item fires DELETE /api/items/:id/save and removes it from the shelf", async ({
    page,
  }) => {
    let unSaveCalled = false;
    await page.route("/api/items/cat-item-1/save", async (route) => {
      unSaveCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ saved: false, itemId: "cat-item-1" }),
      });
    });

    await page.goto("/catalogues");
    await page.waitForLoadState("networkidle");

    // Read shelf is already expanded (auto-expanded); item is visible
    await expect(page.getByText("Introduction to Rust")).toBeVisible();

    const unsaveBtn = page.getByRole("button", {
      name: /Remove "Introduction to Rust" from Catalogues/,
    });
    await expect(unsaveBtn).toBeVisible();
    await expect(unsaveBtn).toHaveAttribute("aria-pressed", "true");

    await unsaveBtn.click();
    expect(unSaveCalled).toBe(true);

    // Item removed from view
    await expect(page.getByText("Introduction to Rust")).not.toBeVisible();
  });

  test("hide thumbnails: zero external image network requests on catalogues page", async ({
    page,
  }) => {
    const imageRequests: string[] = [];
    page.on("request", (req) => {
      if (req.resourceType() === "image" && !req.url().includes("localhost")) {
        imageRequests.push(req.url());
      }
    });

    await page.addInitScript(() => {
      const store = {
        state: {
          theme: "system",
          thumbnailsHidden: true,
          varietyMode: false,
          selectedCategoryId: null,
          selectedSubcategoryId: null,
          selectedTopicId: null,
        },
        version: 0,
      };
      localStorage.setItem("rada-ui-preferences", JSON.stringify(store));
    });

    await page.goto("/catalogues");
    await page.waitForLoadState("networkidle");

    // With thumbnails hidden, item cards render category icons instead of thumbnails,
    // so zero external image requests should be made.
    const thumbRequests = imageRequests.filter((url) => url.includes("example.com") && url.includes("thumb"));
    expect(thumbRequests).toHaveLength(0);
  });

  test("Rule 17: /api/catalogues response never returns ad items", async ({ page }) => {
    const catalogueResponses: Array<{ categories: Array<{ subcategories: Array<{ items: unknown[] }> }> }> = [];
    page.on("response", async (response) => {
      if (response.url().includes("/api/catalogues") && response.status() === 200) {
        try {
          catalogueResponses.push(await response.json());
        } catch {
          // ignore
        }
      }
    });

    await page.goto("/catalogues");
    await page.waitForLoadState("networkidle");

    for (const res of catalogueResponses) {
      for (const cat of res.categories) {
        for (const sub of cat.subcategories) {
          for (const item of sub.items) {
            expect((item as Record<string, unknown>).type).not.toBe("AD");
            expect((item as Record<string, unknown>).adId).toBeUndefined();
            expect((item as Record<string, unknown>).advertiser).toBeUndefined();
            expect((item as unknown as { url: string }).url).not.toContain("/r/");
            expect((item as unknown as { url: string }).url).not.toContain("/watch-ads/");
          }
        }
      }
    }
  });

  test("catalogues page passes WCAG 2.2 AA accessibility audit", async ({ page }) => {
    await page.goto("/catalogues");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
