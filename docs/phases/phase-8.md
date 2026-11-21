# Phase 8: Community Suggestion Requests (`Proposed`)

*Status: `PROPOSED` (Decision `D27`, Open Question `O16`).*
*Skills to run before coding: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md), [`.agents/skills/add-migration/SKILL.md`](../../.agents/skills/add-migration/SKILL.md), and [`.agents/skills/add-api-endpoint/SKILL.md`](../../.agents/skills/add-api-endpoint/SKILL.md).*

## Prerequisites

- **Phase 2 (Feed and Onboarding) exit criteria in [`docs/phases/phase-2.md`](./phase-2.md) must be ticked.**
- **Open Question `O16` in [`docs/product/open-questions.md`](../product/open-questions.md) must be resolved and recorded in [`docs/product/decisions.md`](../product/decisions.md).**

---

## Suggested Implementation Architecture

1. **Database Schema (`prisma/schema.prisma`, append-only migration):**
   - `suggestion_requests`: `id`, `author_id` (or `owner`), `prompt` (required, max 200 chars), `details` (optional, max 500 chars), `category_id`, `subcategory_id`, `topic_id` (strict composite FKs matching `data/taxonomy.json`), `cost_preference` (`free` | `paid` | `any`), `region` (optional), `status` (`pending` | `approved` | `fulfilled` | `closed` | `rejected`), `reply_count` (`Int @default(0)`), `expires_at`, `created_at`, `updated_at`.
   - `suggestion_replies`: `id`, `request_id` (FK to `suggestion_requests`), `item_id` (nullable FK to `items`), `title`, `url`, `note` (max 250 chars), `submitted_by`, `status` (`pending` | `approved` | `rejected`), `created_at`.
2. **API Endpoints (Zod-validated, rate-limited):**
   - `POST /api/requests` — Create a new suggestion request with strict taxonomy validation.
   - `GET /api/requests/[id]` — Fetch a request and its approved replies.
   - `POST /api/requests/[id]/replies` — Submit a content suggestion for a request (enters `/review` as `pending`).
   - `GET /api/feed` — Interleave eligible `approved`, non-expired `suggestion_requests` into the feed response (`kind: "request"` vs `kind: "item"`), respecting active category/subcategory/topic, `Free/Paid`, and `Local` filters.
3. **Feed UI & Flows:**
   - Add a **"Request a suggestion"** CTA in the Feed header (and empty filter state) opening a guided, taxonomy-enforced creation modal.
   - Render `RequestCard` items in `@tanstack/react-virtual` with a `Request` badge, taxonomy tag, reply count, and **"Suggest something"** button.
   - Tapping **"Suggest something"** opens a reply drawer pre-filled with the request's `(category, subcategory, topic)` requiring `title` and valid `url`, displaying **"submitted for review"** on submit.
4. **Moderation & Deduplication (`/review`):**
   - Extend `/review` to review pending requests and replies.
   - Approving a reply creates or links the canonical `Item` in `items` (incrementing `items.popularity_count` if the URL already exists) and increments `suggestion_requests.reply_count`.

---

## Scope & Task Checklist

- [ ] **Schema & Migrations (`add-migration`):**
  - [ ] Add `suggestion_requests` and `suggestion_replies` models with composite taxonomy foreign keys.
  - [ ] Add constraint tests proving requests cannot be saved without valid `(category_id, subcategory_id, topic_id)`.
- [ ] **API & Moderation (`add-api-endpoint`):**
  - [ ] Implement `POST /api/requests`, `GET /api/requests/[id]`, and `POST /api/requests/[id]/replies` with Zod validation and rate limiting.
  - [ ] Extend `GET /api/feed` to interleave eligible `suggestion_requests` while respecting all filters and `Rule 17` (never return ads).
  - [ ] Extend `/api/admin/review-queue` and `/review` UI to moderate requests and replies and link/deduplicate `items`.
- [ ] **Feed UI & Accessibility:**
  - [ ] Build "Request a suggestion" modal, `RequestCard`, and "Suggest something" reply drawer.
  - [ ] Verify WCAG 2.2 AA compliance and `thumbnails_hidden` zero-image-request guarantee.

---

## Exit Criteria

- [ ] Constraint and validation tests prove no request or reply can be saved uncategorised.
- [ ] Playwright e2e + axe tests pass for creating a request, seeing it in the feed, submitting a reply, and approving it in `/review`.
- [ ] Feed performance budgets (`LCP < 2.5 s`, `≥ 55 fps`) remain green with interleaved requests.
