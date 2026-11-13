import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Pre-Launch Survey & Landing Page E2E", () => {
  test("landing page renders how it works, categories, and passes WCAG 2.2 AA", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Headings and content
    await expect(page.getByRole("heading", { name: "Discover what to do," })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How Rada Works" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Curated Across 10 Life Spheres" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Clean, Fast Portfolios" })).toBeVisible();

    // CTA button
    const cta = page.getByRole("link", { name: "Take the Pre-Launch Survey" });
    await expect(cta).toBeVisible();

    // Axe accessibility audit
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("privacy policy page renders and passes WCAG 2.2 AA", async ({ page }) => {
    await page.goto("/privacy");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "1. Our Non-Negotiable Hard Limits" })).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("completes survey flow from welcome to thank-you with submitted for review copy", async ({
    page,
  }) => {
    await page.goto("/survey");
    await page.waitForLoadState("domcontentloaded");

    // Welcome Screen
    await expect(
      page.getByRole("heading", { name: "Help curate the discovery library" })
    ).toBeVisible();

    // Consent checkbox
    const consentCheckbox = page.getByRole("checkbox");
    await expect(consentCheckbox).not.toBeChecked();

    const startButton = page.getByRole("button", { name: "Get Started" });
    await expect(startButton).toBeDisabled();

    await consentCheckbox.check();
    await expect(startButton).toBeEnabled();
    await startButton.click();

    // Categories Screen
    await expect(
      page.getByRole("heading", {
        name: "Which areas do you have great recommendations for?",
      })
    ).toBeVisible();

    // Pick first category: Read
    const readCatButton = page.getByRole("button", { name: "Read" });
    await readCatButton.click();

    const continueButton = page.getByRole("button", {
      name: "Continue to Suggestions",
    });
    await continueButton.click();

    // Suggestions Screen
    await expect(page.getByRole("heading", { name: /Suggest items for/ })).toBeVisible();

    // Finish survey early to test summary
    const finishEarlyButton = page.getByRole("button", {
      name: "Finish survey now",
    });
    await finishEarlyButton.click();

    // Summary Screen
    await expect(
      page.getByRole("heading", { name: /Final Step: Summary & Submission/ })
    ).toBeVisible();

    // Invariant copy: "submitted for review", never "added to the library"
    await expect(page.getByText(/submitted for review/i)).toBeVisible();
    await expect(page.getByText(/added to the library/i)).not.toBeVisible();

    // Choose Option B: Submit Anonymously
    const anonSubmitButton = page.getByRole("button", {
      name: "Submit Anonymously",
    });
    await anonSubmitButton.click();

    // Finished / Thank-you Screen
    await expect(
      page.getByRole("heading", { name: "Thank You for Contributing!" })
    ).toBeVisible();
    await expect(page.getByText(/submitted for review/i)).toBeVisible();
  });
});
