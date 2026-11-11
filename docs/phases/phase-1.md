# Phase 1: Landing Page, Survey and Review Queue

*Source: Section 11 (Phase 1), Section 8.5, and Section 8.7 of the Rada Build Plan.*
*Skill to run before coding: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md).*

## Prerequisites

- **All Phase 0 exit criteria in [`docs/phases/phase-0.md`](./phase-0.md) must be ticked.**

---

## Scope & Task Checklist

- [ ] **Public Landing Page (`8.7`):**
  - [ ] Hero section with one primary call to action.
  - [ ] Three-step "How it works" section.
  - [ ] Category preview across the 10 taxonomy categories.
  - [ ] Example portfolios showcase.
  - [ ] "Advertise with us" link and footer.
- [ ] **Plain-Language Privacy Page (`Section 9`):**
  - [ ] Ship `/privacy` reflecting [`docs/privacy.md`](../privacy.md) before the survey goes live.
- [ ] **Pre-Launch Survey (`8.5`):**
  - [ ] Welcome screen with required explicit consent (`consent_at`).
  - [ ] Category selection screen (at least one category required).
  - [ ] Subcategory suggestion screens (one per subcategory in chosen categories; up to 3 suggestions per subcategory or Skip; autosaved progress so user can finish any time).
  - [ ] Suggestion validation: `title_or_url` (required), `pick_type` (`useful` | `impactful` | `favorite`, required), optional `topic_id`, optional `note` (max 140 chars); `category` and `subcategory` inherited from screen so nothing arrives uncategorised.
  - [ ] Summary & signup prompt: keep picks and create an account, skip signup (anonymous retention disclosed per `O8`), or delete answers.
  - [ ] Thank-you screen with share link; copy states **"submitted for review"**, never *"added to the library"*.
  - [ ] Anti-abuse: max 3 per subcategory, one response per email, spam trap, and endpoint rate limits (`POST /api/survey/sessions`, `PUT /api/survey/sessions/:id/suggestions`, `POST /api/survey/sessions/:id/finish`).
- [ ] **Anonymous Session Claim on Signup:**
  - [ ] Implement `POST /api/survey/sessions/:id/claim` to merge anonymous survey sessions and guest state into the new user account on signup.
- [ ] **Reviewer Screen & Coverage Dashboard (`reviewer` / `admin` role):**
  - [ ] `GET /api/admin/review-queue` and `PATCH /api/admin/items/:id`.
  - [ ] Reviewer UI to approve, reject, merge duplicate (incrementing `popularity_count`), or fix `(category_id, subcategory_id, topic_id)`.
  - [ ] Subcategory coverage dashboard tracking progress toward the launch target of **≥ 10 approved items per subcategory**.
- [ ] **CSV Seed Importer (`import-content` skill):**
  - [ ] Build CSV importer for hand-curated seed items (`data/seed/*.csv`) that strictly validates taxonomy mapping and rejects any uncategorised or partially categorised rows.

---

## Exit Criteria (Must All Pass Before Starting Phase 2)

- [ ] Pre-launch survey end-to-end Playwright test (including axe accessibility check) passes.
- [ ] Constraint and validation tests prove no suggestion or CSV row can be saved without a valid category/subcategory (and topic upon item publication).
- [ ] A reviewer can approve and publish an item from the review queue.
- [ ] [`docs/content-moderation.md`](../content-moderation.md) is complete and current.
