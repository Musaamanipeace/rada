---
name: review-pr
description: Use when reviewing a pull request or self-reviewing changes before submitting a PR. Checks spec alignment, privacy hard limits, ad isolation, accessibility, tests, docs, and TBD exclusions.
---

# Review Pull Request (`review-pr`)

Evaluate every change against these mandatory gates before approving or submitting a PR:

1. **Phase & Scope Compliance:**
   - Does the PR belong to the current active phase (`phase-N/<topic>`)?
   - Is the diff within the size target (~400 changed lines max)?
   - Confirm **zero `TBD` items** from `docs/product/open-questions.md` were built, stubbed, or mocked.
2. **Taxonomy Integrity (Rule 5):**
   - Can any item or suggestion bypass `category_id`, `subcategory_id`, and `topic_id` validation? (If yes, reject.)
3. **Privacy Hard Limits (Rule 6 & Rule 20):**
   - Are there any third-party analytics, pixels, fingerprinting scripts, or undeclared outbound network requests?
   - Does any code read browser history or cache for tracking?
   - Are guest tokens and preferences strictly first-party?
4. **Ad Isolation & Watch Ads Rules (Rules 17, 18, 21):**
   - Do ads appear anywhere outside the Watch Ads tab? (Never in Feed, My Catalogues, Calendar, or Portfolios.)
   - Does `/api/feed` or `/api/catalogues` ever return ads?
   - Does any ad media load or play before the viewer opens Watch Ads and taps play?
   - Is autoplay with sound prevented, and are pause/skip/close controls always visible?
   - Are viewers offered any compensation/rewards? (Forbidden.)
   - When the Watch Ads switch is off, do Watch Ads endpoints return `404` and does zero ad code/media load?
5. **Monetary & Ledger Rules (Rule 19):**
   - Are all monetary values in integer cents?
   - Is `ledger_entries` strictly append-only with a unique `ref`?
   - Is zero card data handled or stored by Rada servers?
6. **Accessibility & Performance (Rule 13):**
   - Do UI changes meet WCAG 2.2 AA (keyboard navigation, focus states, reduced motion, alt text, video captions)?
   - When `thumbnails_hidden` is enabled, does the client make **zero** image requests for feed/catalogue thumbnails (and ad posters)?
7. **Tests & Documentation (Rules 9 & 10):**
   - Are unit tests, Playwright flow tests, and axe accessibility checks included and passing?
   - Are `api.md`, `data-model.md`, `phase-N.md`, `.env.example`, and `CHANGELOG.md` updated in the same PR?
