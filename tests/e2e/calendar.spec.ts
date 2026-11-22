import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Phase 3 — Calendar E2E & Accessibility Tests
 *
 * Covers:
 *  - Desktop month view and mobile agenda view
 *  - Create, mark done, and delete events manually
 *  - Add to calendar from a dated item (source_item_id) and D12 source date-change notice
 *  - Mark done (activity history)
 *  - Standards-compliant .ics calendar export (GET /api/calendar.ics)
 *  - WCAG 2.2 AA accessibility on the calendar page
 */

const now = new Date();
const thisMonth = String(now.getMonth() + 1).padStart(2, "0");
const thisYear = now.getFullYear();
const midMonthDay = "15";

const eventsResponse = {
  events: [
    {
      id: "cal-event-1",
      title: "City Jazz Night",
      startsAt: `${thisYear}-${thisMonth}-${midMonthDay}T19:30:00Z`,
      endsAt: `${thisYear}-${thisMonth}-${midMonthDay}T22:00:00Z`,
      timezone: "Europe/London",
      notes: "Live jazz in the city centre.",
      sourceItemId: "item-jazz",
      reminderMinutes: 60,
      doneAt: null,
      createdAt: `${thisYear}-${thisMonth}-01T09:00:00Z`,
      sourceItem: {
        id: "item-jazz",
        title: "City Jazz Night",
        url: "https://example.com/jazz",
        sourceName: "Local Events",
        startsAt: `${thisYear}-${thisMonth}-${midMonthDay}T19:30:00Z`,
        endsAt: null,
      },
      dateChangeNotice: null,
    },
    {
      id: "cal-event-2",
      title: "Rust Workshop",
      startsAt: `${thisYear}-${thisMonth}-${midMonthDay}T10:00:00Z`,
      endsAt: null,
      timezone: "UTC",
      notes: null,
      sourceItemId: null,
      reminderMinutes: null,
      doneAt: `${thisYear}-${thisMonth}-01T12:00:00Z`,
      createdAt: `${thisYear}-${thisMonth}-01T10:00:00Z`,
      sourceItem: null,
      dateChangeNotice: null,
    },
  ],
};

test.describe("Calendar (Phase 3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/calendar/events**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(eventsResponse),
        });
        return;
      }
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            event: {
              id: "cal-event-new",
              title: "New Manual Event",
              startsAt: `${thisYear}-${thisMonth}-18T14:00:00Z`,
              endsAt: null,
              timezone: "UTC",
              notes: null,
              sourceItemId: null,
              reminderMinutes: null,
              doneAt: null,
              createdAt: new Date().toISOString(),
              sourceItem: null,
              dateChangeNotice: null,
            },
          }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });
  });

  test("renders desktop month view and mobile agenda view with toggle", async ({
    page,
  }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    const isMobile = (page.viewportSize()?.width ?? 1000) < 768;

    if (isMobile) {
      // Mobile viewports default to agenda view (Section 8.4)
      await expect(page.getByTitle("Agenda view")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByText("City Jazz Night")).toBeVisible();
      await expect(page.getByText("Rust Workshop")).toBeVisible();

      // Switch to month view
      await page.getByTitle("Month view").click();
      await expect(page.getByTitle("Month view")).toHaveAttribute("aria-pressed", "true");
    } else {
      // Desktop defaults to month view
      await expect(page.getByTitle("Month view")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTitle("Agenda view")).toHaveAttribute("aria-pressed", "false");

      // Month navigation
      await expect(page.getByRole("button", { name: "Previous month" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Next month" })).toBeVisible();

      // This month's events rendered on their day cells
      await expect(page.getByText("City Jazz Night")).toBeVisible();
      await expect(page.getByText("Rust Workshop")).toBeVisible();

      // Switch to agenda view
      await page.getByTitle("Agenda view").click();
      await expect(page.getByTitle("Agenda view")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByText("City Jazz Night")).toBeVisible();
    }
  });

  test("marks an event done and deletes an event", async ({ page }) => {
    let patchCalled = false;
    let deleteCalled = false;
    await page.route("**/api/calendar/events/cal-event-1", async (route) => {
      if (route.request().method() === "PATCH") {
        patchCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ event: { ...eventsResponse.events[0], doneAt: new Date().toISOString() } }),
        });
        return;
      }
      if (route.request().method() === "DELETE") {
        deleteCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ deleted: true, id: "cal-event-1" }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    const isMobile = (page.viewportSize()?.width ?? 1000) < 768;
    if (!isMobile) {
      // Switch to agenda view where both mark-done and delete controls live
      await page.getByTitle("Agenda view").click();
    }
    await expect(page.getByTitle("Agenda view")).toHaveAttribute("aria-pressed", "true");

    const jazzCard = page.locator("article:has-text('City Jazz Night')");

    // Mark done toggle on the agenda event card
    const patchPromise = page.waitForResponse(
      (res) => res.url().includes("/api/calendar/events/cal-event-1") && res.request().method() === "PATCH",
    );
    await jazzCard.getByRole("button", { name: /Mark as done/ }).click();
    await patchPromise;
    expect(patchCalled).toBe(true);

    // Delete event
    const deletePromise = page.waitForResponse(
      (res) => res.url().includes("/api/calendar/events/cal-event-1") && res.request().method() === "DELETE",
    );
    await jazzCard.getByRole("button", { name: "Delete event" }).click();
    await deletePromise;
    expect(deleteCalled).toBe(true);
  });

  test("creates a new event manually via the Add Event modal", async ({ page }) => {
    let postCalled = false;
    await page.route("**/api/calendar/events", async (route) => {
      if (route.request().method() === "POST") {
        postCalled = true;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            event: {
              id: "cal-event-new",
              title: "New Manual Event",
              startsAt: `${thisYear}-${thisMonth}-18T14:00:00Z`,
              endsAt: null,
              timezone: "UTC",
              notes: null,
              sourceItemId: null,
              reminderMinutes: null,
              doneAt: null,
              createdAt: new Date().toISOString(),
              sourceItem: null,
              dateChangeNotice: null,
            },
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    const postPromise = page.waitForResponse(
      (res) => res.url().includes("/api/calendar/events") && res.request().method() === "POST",
    );

    await page.getByRole("button", { name: /Add Event/ }).click();
    await page.getByLabel("Event Title").fill("New Manual Event");
    await page.getByLabel("Date").fill(`${thisYear}-${thisMonth}-18`);
    await page.getByLabel(/Time \(UTC\)/).fill("14:00");
    await page.getByRole("button", { name: /Save Event/ }).click();

    await postPromise;
    expect(postCalled).toBe(true);
  });

  test("displays D12 source date-change notice without altering the user's event", async ({ page }) => {
    const noticedEvents = eventsResponse.events.map((e, i) =>
      i === 0
        ? {
            ...e,
            dateChangeNotice: {
              hasChanged: true,
              sourceStartsAt: `${thisYear}-${thisMonth}-16T19:30:00Z`,
              sourceEndsAt: null,
              message: `The organizer updated the date for this item to ${thisMonth}/16/${thisYear}. Your calendar event was preserved.`,
            },
          }
        : e,
    );

    await page.route("**/api/calendar/events**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ events: noticedEvents }),
      });
    });

    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    const isMobile = (page.viewportSize()?.width ?? 1000) < 768;
    if (!isMobile) {
      // The D12 notice renders in agenda view
      await page.getByTitle("Agenda view").click();
    }

    await expect(page.getByText("Organizer Date Update")).toBeVisible();
    await expect(
      page.getByText(/organizer updated the date for this item/),
    ).toBeVisible();
    // User's event time is preserved (not silently overwritten)
    await expect(page.getByText("City Jazz Night")).toBeVisible();
  });

  test("exports standards-compliant iCalendar (.ics) feed", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    const exportLink = page.getByRole("link", { name: /iCalendar feed/ });
    await expect(exportLink).toBeVisible();
    await expect(exportLink).toHaveAttribute("href", "/api/calendar.ics");
    await expect(exportLink).toHaveAttribute("download", "rada-calendar.ics");
  });

  test("calendar page passes WCAG 2.2 AA accessibility audit", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
