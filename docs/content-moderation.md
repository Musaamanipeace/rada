# Content Moderation & Review Queue Policy

*Source: Sections 8.5, 11 (Phase 1), and 15 of the Rada Build Plan.*

## 1. Purpose & Scope

Nothing submitted through the pre-launch survey or automated imports goes live in the Rada discovery feed automatically (`8.5`). Every suggested or imported item enters the database with `status = 'pending'` and must be reviewed by a human with the `reviewer` or `admin` role before its status changes to `'approved'`.

> **Launch Coverage Target (`8.5`):** At least **10 approved items per subcategory** (across all 34 subcategories = 340+ approved items minimum) before launch, combining survey suggestions and hand-curated seed items.

---

## 2. Reviewer Workflow (`GET /api/admin/review-queue` & `PATCH /api/admin/items/:id`)

For every pending item or survey suggestion in the review queue, the reviewer performs one of four actions:

1. **Approve (`status = 'approved'`):** Publishes the item to the discovery feed and records `reviewed_by`.
2. **Fix Taxonomy & Approve:** Assigns or corrects the `category_id`, `subcategory_id`, and `topic_id` (ensuring all three levels match [`data/taxonomy.json`](../data/taxonomy.json)) before approving.
3. **Merge Duplicate (`status = 'duplicate'`):** Links the duplicate suggestion/item to the existing canonical `item_id` and increments `items.popularity_count` on the canonical item (`+1`).
4. **Reject (`status = 'rejected'`):** Permanently excludes the item from appearing in the feed.

---

## 3. Mandatory Item Review Checklist

Before clicking **Approve** on any item, a reviewer must verify all five gates:

- [ ] **1. Complete & Accurate Taxonomy (`D2`, Rule 5):**
  - The item has a valid **Category** (Level 1), **Subcategory** (Level 2), and **Topic** (Level 3) from `data/taxonomy.json`.
  - If a survey respondent left the optional `topic_id` blank, the reviewer must select the exact matching Level-3 topic before approval.
  - **Uncategorised or partially categorised items cannot be approved.**
- [ ] **2. Working, Canonical Destination Link:**
  - `url` resolves cleanly over HTTPS without broken pages, paywall traps misrepresented as free, or malicious redirects.
  - Tracking query parameters (`utm_*`, `fbclid`, `gclid`, etc.) are stripped from the stored `url`.
- [ ] **3. Clear Metadata & Date Accuracy:**
  - `title` and `source_name` accurately identify the content and creator/publisher.
  - `description` (if present) is concise (≤ 280 characters), factual, and non-promotional.
  - `cost` (`free` | `paid` | `unknown`) is accurate.
  - For dated items (events, releases, hackathons, scholarships), `starts_at`, `ends_at`, and `timezone` are accurate and still in the future.
- [ ] **4. Duplicate Check:**
  - Verify whether the URL or normalized title already exists in `items`. If it does, use **Merge Duplicate** so `popularity_count` rises on the existing item instead of creating a duplicate entry.
- [ ] **5. Safety & Quality Standards:**
  - Reject anything harmful, illegal, hateful, sexually explicit, spammy, or misleading.
  - Reject low-effort link farms or deceptive affiliate pages.

---

## 4. Pre-Launch Survey Copy & Moderation Rules (`8.5`)

- Survey UI copy must always state that suggestions are **"submitted for review"**, never *"added to the library"*.
- Limits enforced at submission: max 3 suggestions per subcategory per respondent, one survey response per email address, honeypot spam trap, and IP/session rate limiting.
