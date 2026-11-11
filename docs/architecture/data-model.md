# Data Model Specification

*Source: Section 6 of the Rada Build Plan.*
*All schema changes must follow `.agents/skills/add-migration/SKILL.md` and `AGENTS.md` Rule 11 (append-only migrations).*

---

## 1. Core Tables (Phases 0–4)

### 1.1 Identity & Sessions

#### `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `CUID` | `PRIMARY KEY` | Unique user identifier |
| `email` | `TEXT` | `UNIQUE NOT NULL` | Verified user email address |
| `display_name` | `TEXT` | `NULLABLE` | Optional display name |
| `role` | `ENUM` | `NOT NULL DEFAULT 'user'` | `'user'` \| `'reviewer'` \| `'admin'` |
| `region` | `TEXT` | `NULLABLE` | Optional region explicitly entered/allowed by user |
| `thumbnails_hidden` | `BOOLEAN` | `NOT NULL DEFAULT false` | Synced preference for hiding image thumbnails (`D6`) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Account creation timestamp |

#### `anon_sessions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `token` | `TEXT` | `PRIMARY KEY` | First-party anonymous guest token |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Session creation timestamp |

> **Owner Polymorphism:** In `user_interests`, `interactions`, `saved_items`, `survey_sessions`, `ad_events`, `ad_reports`, and `viewer_ad_prefs`, the `owner` field stores either a logged-in `user.id` or a guest `anon_sessions.token`. On signup, guest records are claimed and merged into the new user account.

---

### 1.2 Taxonomy (`data/taxonomy.json` Source of Truth)

#### `categories` (Level 1 — 10 rows)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` / `UUID` | `PRIMARY KEY` | Category ID |
| `slug` | `TEXT` | `UNIQUE NOT NULL` | Stable URL/filter slug |
| `name` | `TEXT` | `NOT NULL` | Display name |
| `sort` | `INTEGER` | `NOT NULL` | Display order (1–10) |

#### `subcategories` (Level 2 — 34 rows)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` / `UUID` | `PRIMARY KEY` | Subcategory ID |
| `parent_id` | `TEXT` / `UUID` | `NOT NULL REFERENCES categories(id)` | Parent category ID |
| `slug` | `TEXT` | `UNIQUE NOT NULL` | Stable URL/filter slug |
| `name` | `TEXT` | `NOT NULL` | Display name |
| `sort` | `INTEGER` | `NOT NULL` | Display order within parent category |

> **Composite Uniqueness:** `UNIQUE (id, parent_id)` on `subcategories` to support composite foreign-key enforcement on `topics`, `items`, and `ads`.

#### `topics` (Level 3)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` / `UUID` | `PRIMARY KEY` | Topic ID |
| `parent_id` | `TEXT` / `UUID` | `NOT NULL REFERENCES subcategories(id)` | Parent subcategory ID |
| `slug` | `TEXT` | `UNIQUE NOT NULL` | Stable URL/filter slug |
| `name` | `TEXT` | `NOT NULL` | Exact topic name (per Section 4) |
| `sort` | `INTEGER` | `NOT NULL` | Display order within parent subcategory |

> **Composite Uniqueness:** `UNIQUE (id, parent_id)` on `topics` so `items` can enforce that `(category_id, subcategory_id, topic_id)` form a valid parent-child chain at the database constraint level.

---

### 1.3 Content Items & Feed Signals

#### `items`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `CUID` | `PRIMARY KEY` | Item ID |
| `title` | `TEXT` | `NOT NULL` | Item title |
| `url` | `TEXT` | `UNIQUE NOT NULL` | Canonical external URL |
| `source_name` | `TEXT` | `NOT NULL` | Publisher or source display name |
| `description` | `VARCHAR(280)` | `NULLABLE` | Short summary (max 280 characters) |
| `thumbnail_url` | `TEXT` | `NULLABLE` | Optional image URL (never requested when `thumbnails_hidden` is true) |
| `category_id` | `TEXT` / `UUID` | `NOT NULL` | Level 1 category (`D2`) |
| `subcategory_id` | `TEXT` / `UUID` | `NOT NULL` | Level 2 subcategory (`D2`) |
| `topic_id` | `TEXT` / `UUID` | `NOT NULL` | Level 3 topic (`D2`) |
| `cost` | `ENUM` | `NOT NULL DEFAULT 'unknown'` | `'free'` \| `'paid'` \| `'unknown'` |
| `starts_at` | `TIMESTAMPTZ` | `NULLABLE` | Start date/time for dated events or releases |
| `ends_at` | `TIMESTAMPTZ` | `NULLABLE` | End date/time for dated events |
| `timezone` | `TEXT` | `NULLABLE` | IANA timezone identifier for dated items |
| `region` | `TEXT` | `NULLABLE` | Geographic region for local items |
| `status` | `ENUM` | `NOT NULL DEFAULT 'pending'` | `'pending'` \| `'approved'` \| `'rejected'` \| `'expired'` \| `'duplicate'` |
| `origin` | `ENUM` | `NOT NULL` | `'seed'` \| `'survey'` \| `'import'` |
| `popularity_count` | `INTEGER` | `NOT NULL DEFAULT 1` | Incremented when duplicate survey picks or imports are merged |
| `reviewed_by` | `UUID` / `CUID` | `NULLABLE REFERENCES users(id)` | Reviewer who approved/rejected the item |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Last update timestamp |

> **Mandatory Composite Foreign Key Constraint (`D2`, Rule 5):**
> - `FOREIGN KEY (subcategory_id, category_id) REFERENCES subcategories(id, parent_id)`
> - `FOREIGN KEY (topic_id, subcategory_id) REFERENCES topics(id, parent_id)`
> This guarantees in PostgreSQL that `category_id`, `subcategory_id`, and `topic_id` are never `NULL` and always belong to the exact same taxonomy branch.

#### `user_interests`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `owner` | `TEXT` | `NOT NULL` | User ID or anonymous token |
| `subcategory_id` | `TEXT` / `UUID` | `NOT NULL REFERENCES subcategories(id)` | Stated interest subcategory |
| `weight` | `REAL` | `NOT NULL DEFAULT 1.0` | Interest weight |

- **Primary Key / Unique:** `PRIMARY KEY (owner, subcategory_id)`

#### `interactions` (Append-Only)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `CUID` | `PRIMARY KEY` | Interaction ID |
| `owner` | `TEXT` | `NOT NULL` | User ID or anonymous token |
| `item_id` | `UUID` / `CUID` | `NOT NULL REFERENCES items(id)` | Target item |
| `type` | `ENUM` | `NOT NULL` | `'open'` \| `'save'` \| `'unsave'` \| `'calendar_add'` \| `'dismiss'` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Timestamp (decays over 30 days in ranking v1) |

#### `saved_items` (My Catalogues)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `owner` | `TEXT` | `NOT NULL` | User ID or anonymous token |
| `item_id` | `UUID` / `CUID` | `NOT NULL REFERENCES items(id)` | Saved item |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Save timestamp |

- **Unique Constraint:** `UNIQUE (owner, item_id)`

---

### 1.4 Calendar

#### `calendar_events`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `CUID` | `PRIMARY KEY` | Calendar event ID |
| `user_id` | `UUID` / `CUID` | `NOT NULL REFERENCES users(id)` | Event owner |
| `title` | `TEXT` | `NOT NULL` | Event title |
| `starts_at` | `TIMESTAMPTZ` | `NOT NULL` | Start timestamp |
| `ends_at` | `TIMESTAMPTZ` | `NULLABLE` | End timestamp |
| `timezone` | `TEXT` | `NOT NULL` | IANA timezone |
| `notes` | `TEXT` | `NULLABLE` | User notes |
| `source_item_id` | `UUID` / `CUID` | `NULLABLE REFERENCES items(id)` | Link to source item (`D12`: show notice if item date changes) |
| `reminder_minutes` | `INTEGER` | `NULLABLE` | Minutes before `starts_at` to remind |
| `done_at` | `TIMESTAMPTZ` | `NULLABLE` | Marked done timestamp (populates activity history) |

---

### 1.5 Pre-Launch Survey

#### `survey_sessions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `CUID` | `PRIMARY KEY` | Survey session ID |
| `owner` | `TEXT` | `NOT NULL` | Anonymous token or user ID |
| `consent_at` | `TIMESTAMPTZ` | `NOT NULL` | Explicit consent timestamp |
| `finished_at` | `TIMESTAMPTZ` | `NULLABLE` | Completion timestamp |
| `claimed_user_id` | `UUID` / `CUID` | `NULLABLE REFERENCES users(id)` | User ID if claimed on signup |

#### `survey_suggestions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `CUID` | `PRIMARY KEY` | Suggestion ID |
| `session_id` | `UUID` / `CUID` | `NOT NULL REFERENCES survey_sessions(id)` | Parent survey session |
| `subcategory_id` | `TEXT` / `UUID` | `NOT NULL REFERENCES subcategories(id)` | Screen subcategory (never uncategorised) |
| `topic_id` | `TEXT` / `UUID` | `NULLABLE REFERENCES topics(id)` | Optional level-3 topic |
| `title_or_url` | `TEXT` | `NOT NULL` | Suggested title or URL |
| `pick_type` | `ENUM` | `NOT NULL` | `'useful'` \| `'impactful'` \| `'favorite'` |
| `note` | `VARCHAR(140)` | `NULLABLE` | Optional note (max 140 chars) |
| `status` | `ENUM` | `NOT NULL DEFAULT 'pending'` | `'pending'` \| `'approved'` \| `'rejected'` \| `'duplicate'` |
| `item_id` | `UUID` / `CUID` | `NULLABLE REFERENCES items(id)` | Populated when approved or merged into an item |

---

### 1.6 Portfolios

#### `portfolios`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `CUID` | `PRIMARY KEY` | Portfolio ID |
| `user_id` | `UUID` / `CUID` | `UNIQUE NOT NULL REFERENCES users(id)` | Portfolio owner |
| `username` | `TEXT` | `UNIQUE NOT NULL` | Public URL slug (`/<username>`) |
| `headline` | `TEXT` | `NOT NULL` | Profile headline |
| `intro` | `TEXT` | `NULLABLE` | Profile bio/introduction |
| `avatar` | `TEXT` | `NULLABLE` | Avatar image URL/key |
| `template` | `TEXT` | `NOT NULL` | One of the 3 MVP templates |
| `theme` | `TEXT` | `NOT NULL` | Theme identifier |
| `visibility` | `ENUM` | `NOT NULL DEFAULT 'draft'` | `'draft'` \| `'public'` \| `'unlisted'` |

#### Child tables (`portfolio_sections`, `portfolio_projects`, `portfolio_links`)
- Each references `portfolio_id` (`NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE`).
- Each includes `sort_order INTEGER NOT NULL` and `hidden BOOLEAN NOT NULL DEFAULT false`.
- `portfolio_projects` stores 1–3 MVP projects (`title`, `description`, `url`, `image_url`, `sort_order`, `hidden`).
- `portfolio_links` stores external/contact links (`label`, `url`, `sort_order`, `hidden`).

---

### 1.7 Audit Log

#### `audit_log`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` / `CUID` | `PRIMARY KEY` | Log entry ID |
| `actor` | `TEXT` | `NOT NULL` | User ID or system job identifier |
| `action` | `TEXT` | `NOT NULL` | Action performed |
| `target` | `TEXT` | `NOT NULL` | Target entity type and ID |
| `at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Event timestamp |

---

## 2. Ads Tables (Create in Phase 6a Only — Never Before)

> **Phase Gate Rule:** Do not create these tables or their migrations until Phase 6a begins and the Phase 6 prerequisites in [`docs/product/open-questions.md`](../product/open-questions.md) are answered.

### 2.1 Advertisers & Campaigns

- **`advertisers`:** `id`, `name`, `website`, `contact_email`, `status` (`'pending'` | `'approved'` | `'suspended'`), `free_views_granted` (`INTEGER NOT NULL DEFAULT 0`), `free_views_used` (`INTEGER NOT NULL DEFAULT 0`), `created_at`.
- **`advertiser_members`:** `advertiser_id`, `user_id`, `role` (`'owner'` | `'editor'` | `'viewer'`). `PRIMARY KEY (advertiser_id, user_id)`.
- **`campaigns`:** `id`, `advertiser_id`, `name`, `status` (`'draft'` | `'in_review'` | `'approved'` | `'live'` | `'paused'` | `'completed'` | `'rejected'`), `start_at`, `end_at`, `budget_cents` (`INTEGER NOT NULL`), `daily_cap_cents` (`INTEGER NOT NULL`), `rate_card_id` (`REFERENCES rate_cards(id)`), `created_at`.
- **`ads`:** `id`, `campaign_id`, `format` (`'story'` | `'video'`), `title` (`VARCHAR(80) NOT NULL`), `description` (`VARCHAR(280) NOT NULL`), `cta_label` (`TEXT NOT NULL`), `cta_url` (`TEXT NOT NULL`), `category_id` (`NOT NULL`), `subcategory_id` (`NOT NULL`, composite FK with `category_id`), `status` (`'draft'` | `'in_review'` | `'approved'` | `'rejected'` | `'paused'`), `rejection_reason` (`TEXT NULLABLE`), `published_at` (`TIMESTAMPTZ NULLABLE`).
- **`ad_assets`:** `id`, `ad_id`, `kind` (`'image'` | `'video'` | `'caption'` | `'poster'`), `storage_key`, `mime`, `bytes`, `duration_s`, `width`, `height`, `alt_text` (required when `kind = 'image'`; a row with `kind = 'caption'` is required when `ads.format = 'video'`).
- **`ad_targeting`:** `campaign_id`, `category_ids` (`TEXT[] NOT NULL`), `regions` (`TEXT[] NULLABLE`).
- **`ad_reviews`:** `id`, `ad_id` (nullable), `advertiser_id` (nullable), `reviewer_id` (`REFERENCES users(id)`), `decision` (`'approved'` | `'rejected'`), `reason`, `checklist` (`JSONB NOT NULL`), `at` (`TIMESTAMPTZ`).

### 2.2 Rate Cards, Events, Daily Stats & Append-Only Ledger

- **`rate_cards`:** `id`, `price_per_qualified_view_cents` (`INTEGER NOT NULL`), `min_topup_cents` (`INTEGER NOT NULL`), `active_from` (`TIMESTAMPTZ NOT NULL`).
- **`ad_events` (Append-Only; 90-day retention per `docs/privacy.md`):** `id`, `ad_id`, `owner` (user ID or anonymous token), `type` (`'impression'` | `'view_start'` | `'qualified_view'` | `'complete'` | `'click'` | `'not_interested'` | `'hide_advertiser'` | `'report'`), `at` (`TIMESTAMPTZ NOT NULL DEFAULT now()`).
- **`ad_stats_daily` (Written only by the 5-minute aggregation job):** `ad_id`, `day` (`DATE`), `impressions`, `qualified_views`, `free_qualified_views`, `completes`, `clicks`, `spend_cents` (`INTEGER NOT NULL DEFAULT 0`). `PRIMARY KEY (ad_id, day)`.
- **`ledger_entries` (Strictly Append-Only; balance = `SUM(amount_cents)`):**
  - `id` (`PRIMARY KEY`)
  - `advertiser_id` (`NOT NULL REFERENCES advertisers(id)`)
  - `campaign_id` (`NULLABLE REFERENCES campaigns(id)`)
  - `type` (`'topup'` | `'spend'` | `'refund'` | `'adjustment'`)
  - `amount_cents` (`INTEGER NOT NULL` — signed integer: positive for `topup`/`refund`, negative for `spend`, signed for `adjustment`)
  - `ref` (`TEXT UNIQUE NOT NULL` — payment reference, manual credit note ID, or deterministic aggregation job key)
  - `at` (`TIMESTAMPTZ NOT NULL DEFAULT now()`)
- **`ad_reports`:** `id`, `ad_id`, `owner`, `reason`, `status` (`'open'` | `'reviewed'` | `'dismissed'`), `at`.
- **`viewer_ad_prefs`:** `owner` (`PRIMARY KEY`), `hidden_advertiser_ids` (`TEXT[] NOT NULL DEFAULT '{}'`), `hidden_ad_ids` (`TEXT[] NOT NULL DEFAULT '{}'`).
