## Summary

- **Phase:** `phase-N/<topic>`
- **What changed:**
- **Related issue(s) / ADR(s):**

## Mandatory Checklist (per `AGENTS.md` & `review-pr` skill)

- [ ] **Phase Scope:** Belongs strictly to the active phase; previous phase exit criteria are met.
- [ ] **No TBD Built:** Zero `TBD` items from `docs/product/open-questions.md` were built, stubbed, or mocked.
- [ ] **PR Size:** Diff is focused and small (~400 changed lines or fewer).
- [ ] **Taxonomy Enforcement:** Every item/suggestion has a validated `category`, `subcategory`, and `topic`.
- [ ] **Privacy Hard Limits:** Zero third-party analytics, pixels, fingerprinting, or undeclared outbound requests.
- [ ] **Ad Isolation:** Ads appear only in Watch Ads after tap-to-play; `/api/feed` and `/api/catalogues` never return ads; Watch Ads switch is respected.
- [ ] **Accessibility & Performance:** Meets WCAG 2.2 AA (keyboard, axe, captions/alt text); `thumbnails_hidden` triggers zero thumbnail/poster image requests.
- [ ] **Tests Included:** Unit tests (Vitest), flow tests (Playwright), and axe checks added and passing.
- [ ] **Documentation Updated:** Updated `api.md`, `data-model.md`, `taxonomy.md`, `docs/phases/phase-N.md`, `.env.example`, and `CHANGELOG.md` in this PR.

## Declaration of Dependencies / Schema / Outbound Requests

- **New dependencies:** None
- **Schema migrations:** None
- **New outbound network requests (requires ADR):** None
