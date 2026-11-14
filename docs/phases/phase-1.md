# Phase 1: Landing Page, Survey and Review Queue

*Source: Section 11 (Phase 1), Section 8.5, and Section 8.7 of the Rada Build Plan.*
*Skill to run before coding: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md).*

## Prerequisites

- **All Phase 0 exit criteria in [`docs/phases/phase-0.md`](./phase-0.md) must be ticked.**

---

## Scope & Task Checklist

- [x] **Public Landing Page (`8.7`):**
  - [x] Hero section with one primary call to action.
  - [x] Three-step "How it works" section.
  - [x] Category preview across the 10 taxonomy categories.
  - [x] Example portfolios showcase.
  - [x] "Advertise with us" link and footer.
- [x] **Plain-Language Privacy Page (`Section 9`):**
  - [x] Ship `/privacy` reflecting [`docs/privacy.md`](../privacy.md) before the survey goes live.
- [x] **Pre-Launch Survey (`8.5`):**
  - [x] Welcome screen with required explicit consent (`consent_at`).
  - [x] Category selection screen (at least one category required).
  - [x] Subcategory suggestion screens (one per subcategory in chosen categories; up to 5 suggestions per subcategory or Skip; autosaved progress so user can finish any time).
  - [x] Suggestion validation: `title` (required), `url` (valid http/https link required), `pick_type` (`useful` | `impactful` | `favorite`, required), optional `topic_id`, optional `note` (max 140 chars); `category` and `subcategory` inherited from screen so nothing arrives uncategorised; summary displays clickable title previews.
  - [x] Summary & signup prompt: keep picks and create an account, skip signup (anonymous retention disclosed per `O8`), or delete answers.
  - [x] Thank-you screen with share link; copy states **"submitted for review"**, never *"added to the library"*.
  - [x] Anti-abuse: max 5 per subcategory, one response per email, spam trap, and endpoint rate limits (`POST /api/survey/sessions`, `PUT /api/survey/sessions/:id/suggestions`, `POST /api/survey/sessions/:id/finish`).
- [x] **Anonymous Session Claim on Signup:**
  - [x] Implement `POST /api/survey/sessions/:id/claim` to merge anonymous survey sessions and guest state into the new user account on signup.
- [x] **Reviewer Screen & Coverage Dashboard (`reviewer` / `admin` role):**
  - [x] `GET /api/admin/review-queue` and `PATCH /api/admin/review-queue/:id`.
  - [x] Reviewer UI to approve, reject, merge duplicate (incrementing `popularity_count`), or fix `(category_id, subcategory_id, topic_id)`.
  - [x] Subcategory coverage dashboard tracking progress toward the launch target of **≥ 10 approved items per subcategory**.
- [x] **CSV Seed Importer (`import-content` skill):**
  - [x] Build CSV importer for hand-curated seed items (`data/seed/*.csv`) that strictly validates taxonomy mapping and rejects any uncategorised or partially categorised rows.

---

## Exit Criteria (Must All Pass Before Starting Phase 2)

- [x] Pre-launch survey end-to-end Playwright test (including axe accessibility check) passes.
- [x] Constraint and validation tests prove no suggestion or CSV row can be saved without a valid category/subcategory (and topic upon item publication).
- [x] A reviewer can approve and publish an item from the review queue.
- [x] [`docs/content-moderation.md`](../content-moderation.md) is complete and current.
