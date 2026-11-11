# API Contract Specification

*Source: Section 7 of the Rada Build Plan.*
*Per `.agents/skills/add-api-endpoint/SKILL.md`: **Always write or update the contract in this file before implementing the route handler.***

---

## 1. Global API Rules

1. **Boundary Validation:** Every endpoint validates path params, query params, and request bodies with **Zod** (`AGENTS.md` Rule 14).
2. **Standard Error Shape:** All error responses (`4xx`, `5xx`) use one consistent JSON envelope:
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Human-readable summary of the error",
       "fields": {
         "fieldName": ["Detailed field validation message"]
       }
     }
   }
   ```
3. **Rate Limiting:** Rate limit every public endpoint by IP / session owner token.
4. **CSRF & Role Checks:** Enforce CSRF protection on all state-changing methods (`POST`, `PUT`, `PATCH`, `DELETE`) and explicit role checks (`reviewer`, `admin`, or `advertiser` member roles) on protected routes.
5. **Strict Ad Isolation (`Rule 17`):** `/api/feed` and `/api/catalogues` **must never return ads** under any condition. An automated test enforces this invariant.

---

## 2. Core Endpoints (Phases 1–4)

### 2.1 Discovery Feed & Item Actions

#### `GET /api/feed`
Returns a cursor-paginated batch of approved discovery items (20 items per batch).
- **Auth:** Open (uses logged-in user ID or guest `anon_sessions` token).
- **Query Parameters:**
  - `cursor` (`string`, optional): Opaque pagination cursor.
  - `limit` (`number`, default `20`, max `20`): Batch size.
  - `categories` (`string`, optional): Comma-separated category slugs (none = user's stated interests).
  - `subcategory` (`string`, optional): Subcategory slug filter.
  - `topic` (`string`, optional): Level-3 topic slug filter.
  - `mode` (`'variety'`, optional): Enables Variety mode (`D3`), cycling through all 10 categories.
  - `cost` (`'free' | 'paid'`, optional): Cost filter toggle (`D13`).
  - `upcoming` (`boolean`, optional): Filter to future-dated items (`starts_at > now`).
  - `local` (`boolean`, optional): Filter to items matching the user's explicit `region`.
- **Response (`200 OK`):** `{ items: FeedItem[], nextCursor: string | null, recycled: boolean }`
- **Invariant:** Never returns dismissed items, already-saved items, past-dated items, or ads.

#### `POST /api/items/:id/save`
Saves an item to the owner's My Catalogues (`saved_items`) and appends a `save` interaction.
- **Auth:** Authenticated user or guest token (guest saves merge on signup per `8.3`).
- **Response (`200 OK`):** `{ saved: true, itemId: string }`

#### `DELETE /api/items/:id/save`
Removes an item from `saved_items` and appends an `unsave` interaction (`D4`).
- **Auth:** Authenticated user or guest token.
- **Response (`200 OK`):** `{ saved: false, itemId: string }`

#### `POST /api/items/:id/dismiss`
Marks an item as "Not interested" by appending a `dismiss` interaction (`-3` signal and permanent exclusion for this owner).
- **Auth:** Authenticated user or guest token.
- **Response (`200 OK`):** `{ dismissed: true, itemId: string }`

#### `POST /api/interactions`
Records an in-app interaction (`open`, `calendar_add`) in the append-only `interactions` table.
- **Auth:** Authenticated user or guest token.
- **Body:** `{ itemId: string, type: 'open' | 'calendar_add' }`
- **Response (`201 Created`):** `{ ok: true }`

---

### 2.2 My Catalogues

#### `GET /api/catalogues`
Returns the owner's saved items grouped by the 10 categories and their subcategories (`8.3`).
- **Auth:** Authenticated user (or guest token prior to signup merge).
- **Response (`200 OK`):** `{ categories: Array<{ slug, name, subcategories: Array<{ slug, name, items: SavedItem[] }> }> }`
- **Invariant:** Must never return ads.

---

### 2.3 Calendar

#### `GET /api/calendar/events`
Lists the user's calendar events within a date range, including source item date-change notices (`D12`).
- **Auth:** Authenticated user (`D11`).
- **Query Parameters:** `from` (ISO date), `to` (ISO date).

#### `POST /api/calendar/events`
Creates a calendar event manually or from a dated item (`source_item_id`).
- **Auth:** Authenticated user.
- **Body:** `{ title, startsAt, endsAt?, timezone, notes?, sourceItemId?, reminderMinutes? }`

#### `PATCH /api/calendar/events/:id`
Updates an event's details or marks it done (`doneAt`).
- **Auth:** Authenticated user (owner of the event).

#### `DELETE /api/calendar/events/:id`
Deletes a calendar event.
- **Auth:** Authenticated user (owner of the event).

#### `GET /api/calendar.ics`
Exports the user's calendar events as a standards-compliant iCalendar (`text/calendar`) stream (`8.4`).
- **Auth:** Authenticated user.

---

### 2.4 Pre-Launch Survey (`8.5`)

#### `POST /api/survey/sessions`
Starts a survey session after explicit user consent.
- **Body:** `{ consent: true, selectedCategories: string[] }`
- **Response (`201 Created`):** `{ sessionId: string }`

#### `PUT /api/survey/sessions/:id/suggestions`
Autosaves up to 3 suggestions for a specific subcategory screen.
- **Body:**
  ```json
  {
    "subcategoryId": "string",
    "suggestions": [
      {
        "titleOrUrl": "string",
        "pickType": "useful | impactful | favorite",
        "topicId": "string (optional)",
        "note": "string (max 140 chars, optional)"
      }
    ]
  }
  ```

#### `POST /api/survey/sessions/:id/finish`
Marks the survey session finished and processes the respondent's data choice (`keep` or `delete`).

#### `POST /api/survey/sessions/:id/claim`
Claims an anonymous survey session and guest interactions/saves into the newly authenticated user account.

---

### 2.5 Content Moderation & Review Queue (`Reviewer Role`)

#### `GET /api/admin/review-queue`
Lists pending items and survey suggestions awaiting moderation, plus subcategory coverage counts (target ≥10 approved items per subcategory).
- **Auth:** `role IN ('reviewer', 'admin')`.

#### `PATCH /api/admin/items/:id`
Approves, rejects, merges a duplicate (incrementing `popularity_count`), or corrects the `(category_id, subcategory_id, topic_id)` taxonomy assignment of an item.
- **Auth:** `role IN ('reviewer', 'admin')`.

---

### 2.6 Portfolio (`8.6`)

#### `GET | POST | PATCH | DELETE /api/portfolio`
CRUD operations for the authenticated user's portfolio (`headline`, `intro`, `avatar`, `template`, `theme`, `visibility`, `projects` [1–3], `links`). Supports editor autosave.
- **Auth:** Authenticated user.

#### `POST /api/portfolio/publish`
Validates the completion checklist and updates portfolio `visibility` (`'public'` | `'unlisted'` | `'draft'`).
- **Auth:** Authenticated user.

#### `GET /<username>` (Public App Route)
Renders the public or unlisted portfolio page. Returns `404` if `visibility === 'draft'`.

---

### 2.7 User Data & Privacy Controls (`Section 9`)

#### `GET /api/me/data`
Exports all data held for the user (`users`, `user_interests`, `interactions`, `saved_items`, `calendar_events`, `survey_sessions`, `portfolios`).
- **Auth:** Authenticated user.

#### `DELETE /api/me/data`
Permanently deletes the user's interactions, saved items, calendar, portfolio, and account data.
- **Auth:** Authenticated user.

---

## 3. Ads & Advertiser Endpoints (Phase 6 Only)

> **Watch Ads Switch Gate (`D23`, Rule 21):** While the Watch Ads switch is `false` (launch default), all viewer Watch Ads endpoints (`/api/watch/*`, `/r/:adId`) must immediately return `404 Not Found`.

### 3.1 Viewer Watch Ads Endpoints (`Phase 6b`)

- **`GET /api/watch?cursor&limit&category&subcategory&sort=newest|popular`:** Returns eligible live ads matching the viewer's selected category/subcategory filters and optional region, excluding hidden ads/advertisers (`viewer_ad_prefs`).
- **`GET /api/watch/:adId`:** Returns metadata and playback asset descriptors for a single eligible ad when tapped.
- **`POST /api/watch/events`:** Ingests batched first-party playback events (`impression`, `view_start`, `qualified_view`, `complete`, `click`, `not_interested`, `hide_advertiser`, `report`) with per-owner rate limiting and deduplication.
- **`GET /r/:adId`:** First-party click redirect. Records a `click` event and redirects (`302`) to `ads.cta_url` with **only** the `adId` appended—never any viewer identifier.
- **`POST /api/watch/:adId/hide`:** Adds `adId` to `viewer_ad_prefs.hidden_ad_ids` immediately.
- **`POST /api/watch/advertisers/:id/hide`:** Adds `advertiserId` to `viewer_ad_prefs.hidden_advertiser_ids` immediately.
- **`POST /api/watch/:adId/report`:** Submits an ad report (`ad_reports`); auto-pauses the ad if the report threshold is reached.

### 3.2 Advertiser Portal Endpoints (`Phase 6a / 6c`)

- **`POST /api/advertiser/signup`:** Submits advertiser business onboarding details (`name`, `website`, `contact_email`) for human review.
- **`GET | PATCH /api/advertiser/profile`:** Views or updates advertiser business profile.
- **`GET | POST /api/advertiser/campaigns`:** Lists or creates draft campaigns.
- **`GET | PATCH /api/advertiser/campaigns/:id`:** Views or autosaves a draft campaign.
- **`POST /api/advertiser/campaigns/:id/submit`:** Transitions campaign from `draft` to `in_review` (requires all ad assets validated).
- **`POST /api/advertiser/campaigns/:id/pause`:** Transitions campaign between `live` and `paused` (if balance/allowance permits resume).
- **`GET | POST | PATCH /api/advertiser/ads`:** Creates or edits ad creatives (editing an `approved` ad sends it back to `in_review`).
- **`POST /api/advertiser/assets`:** Issues a signed upload URL for ad media (`image`, `video`, `caption`, `poster`).
- **`POST /api/advertiser/topup-request`:** Notifies the Owner that the advertiser wishes to add prepaid credit (`D24`).
- **`GET /api/advertiser/stats?from&to&campaign`:** Returns daily aggregated stats from `ad_stats_daily` and ledger summary (category breakdowns hidden below 20 qualified views).
- **`GET /api/advertiser/stats.csv`:** Exports daily aggregated campaign/ad stats as CSV.

### 3.3 Ad Reviewer & Owner Admin Endpoints (`Phase 6b / 6c`)

- **`GET /api/admin/ad-review-queue`** (`reviewer` / `admin`): Lists pending advertisers, ads in `in_review`, and open `ad_reports`.
- **`PATCH /api/admin/advertisers/:id`** (`reviewer` / `admin`): Approves (granting the one-time free view allowance) or rejects/suspends an advertiser with a reason and completed checklist.
- **`PATCH /api/admin/ads/:id`** (`reviewer` / `admin`): Approves or rejects an ad creative with a reason and completed review checklist (`ad_reviews`).
- **`POST /api/admin/advertisers/:id/credit`** (`admin` / Owner only): Adds a manual credit (`topup`, `refund`, or `adjustment` in integer cents) with a mandatory unique reference note (`ref`) to `ledger_entries`.
- **`GET | PATCH /api/admin/config`** (`admin` / Owner only): Reads or updates runtime configuration (free allowance amount, active rate card, daily caps, Watch Ads master switch).
- **`POST /api/webhooks/payments`** (*Deferred — Not built at launch per `D24`*): Signature-verified, idempotent webhook handler if a hosted payment provider is added later.
