# Phase 6: Watch Ads and Advertiser Portal (`6a`–`6d`)

*Source: Section 11 (Phase 6) and Sections 8.8–8.11 of the Rada Build Plan.*
*Skills to run: [`start-phase`](../../.agents/skills/start-phase/SKILL.md), [`add-migration`](../../.agents/skills/add-migration/SKILL.md), [`add-api-endpoint`](../../.agents/skills/add-api-endpoint/SKILL.md), [`add-ad-format`](../../.agents/skills/add-ad-format/SKILL.md), [`billing-change`](../../.agents/skills/billing-change/SKILL.md).*

> **Launch Note (`D23`):** Phase 6 does not need to ship at initial launch. The Watch Ads master switch stays **off** by default until the first advertiser is approved.

## Mandatory Prerequisites (Blockers Before Starting Phase 6)

- **All Phase 4 exit criteria in [`docs/phases/phase-4.md`](./phase-4.md) must be ticked.**
- **Open items in [`docs/product/open-questions.md`](../product/open-questions.md) must be resolved and recorded in [`docs/product/decisions.md`](../product/decisions.md):**
  - `O1` (Free allowance count, price per qualified view, min top-up, daily caps) — required before first advertiser approval / `6c`.
  - `O2` (Final restricted ad categories and review checklist in `docs/ad-policy.md`) — blocks `6b`.
  - `O3` (Video hosting & transcoding provider ADR) — blocks `6d`.
  - `O4` (Advertiser Terms of Service, ad disclosure rules, refund policy) — blocks first paid advertiser.

---

## Slice 6a: Advertiser Accounts and Campaign Builder

- [ ] Create Phase 6 database tables and append-only migrations (`advertisers`, `advertiser_members`, `campaigns`, `ads`, `ad_assets`, `ad_targeting`, `ad_reviews`, `rate_cards`, `ad_events`, `ad_stats_daily`, `ledger_entries`, `ad_reports`, `viewer_ad_prefs`).
- [ ] Confirm [`docs/ad-policy.md`](../ad-policy.md) and [`docs/architecture/ads-pipelines.md`](../architecture/ads-pipelines.md).
- [ ] Implement Advertiser onboarding (`POST /api/advertiser/signup`, email verification, reviewer approval granting one free allowance per business and website).
- [ ] Implement Campaign Builder (`src/features/ads/advertiser`) with autosave draft, targeting (`category_ids`, optional `regions`), budget/daily cap, and the **Story** format (1–5 images with required `alt_text`, title, description, CTA).
- [ ] Implement signed image upload and validation pipeline (`src/lib/ads/media`).
- [ ] Implement the Campaign Lifecycle State Machine (`src/lib/ads/policy`) with unit tests covering every allowed transition and refusing every illegal transition.

### Exit Criteria — Slice 6a
- [ ] An approved advertiser can create, autosave, and submit a Story campaign (`draft` → `in_review`).
- [ ] Every illegal campaign or ad state transition is refused and covered by unit tests.
- [ ] Database and Zod validation tests prove no ad can be saved without a valid `category_id` and `subcategory_id` and required `alt_text`.

---

## Slice 6b: Review and the Watch Ads Tab

- [ ] Confirm `O2` (Ad policy & review checklist) is locked in `docs/ad-policy.md`.
- [ ] Implement Ad Review Queue & Checklist UI (`src/features/ads/review`, `GET /api/admin/ad-review-queue`, `PATCH /api/admin/advertisers/:id`, `PATCH /api/admin/ads/:id`).
- [ ] Implement Ad Serving module (`src/lib/ads/serving`, `GET /api/watch`, `GET /api/watch/:adId`) with category/region filtering, Popular/Newest sorting, advertiser share rotation, and Watch Ads switch gate (`404` when off).
- [ ] Implement Watch Ads Viewer Tab (`src/features/ads/watch`): browse cards with `Ad` label, tap-to-play (no media loads before tap; muted by default; captions on; pause/skip/close always available), `/r/:adId` first-party CTA redirect (`rel="noopener noreferrer"`), Not interested, Hide advertiser, Report (auto-pause at threshold), and `thumbnails_hidden` support.

### Exit Criteria — Slice 6b
- [ ] Only `approved` ads inside `live` campaigns (within schedule and budget/allowance) are returned by `/api/watch`.
- [ ] Automated test proves `/api/feed` and `/api/catalogues` **never** return ads.
- [ ] Playwright network test proves **nothing loads or plays** before the viewer opens Watch Ads and taps play, and returns `404` when the Watch Ads switch is off.
- [ ] Accessibility checks (`@axe-core/playwright`, keyboard navigation, visible pause control, captions/alt text) pass.

---

## Slice 6c: Events, Billing and Reporting

- [ ] Implement batched event ingestion (`POST /api/watch/events`, `src/lib/ads/events`) with per-owner rate limiting and 24-hour per-owner-per-ad billable view deduplication.
- [ ] Implement the qualified-view rule (5 seconds of playback or 50% of duration, whichever comes first).
- [ ] Implement the 5-minute aggregation & billing job (`src/lib/ads/billing`): updates `ad_stats_daily`, consumes `free_views_granted` first (`free_views_used` increments, `spend_cents = 0`), then writes integer-cent `spend` entries with unique `ref` to append-only `ledger_entries`.
- [ ] Implement automatic campaign pausing & email notification when free allowance and prepaid balance are exhausted or budget/daily cap is hit.
- [ ] Implement Owner Admin Screen (`POST /api/admin/advertisers/:id/credit`, `GET | PATCH /api/admin/config`) for manual credit top-ups with reference notes (`D24`) and advertiser top-up requests (`POST /api/advertiser/topup-request`).
- [ ] Implement Advertiser Stats dashboard & CSV export (`GET /api/advertiser/stats`, `GET /api/advertiser/stats.csv`) with minimum audience threshold (20 qualified views) for category breakdowns.
- [ ] Implement nightly reconciliation check comparing `ad_stats_daily`, `advertisers.free_views_used`, and `ledger_entries`.

### Exit Criteria — Slice 6c
- [ ] Integration test proves a simulated advertiser consumes their free allowance first (`spend_cents = 0`), then spends from their prepaid balance at the exact rate card price.
- [ ] Idempotency test proves replaying the exact same event batch or job run changes nothing in `ad_stats_daily`, `free_views_used`, or `ledger_entries`.
- [ ] Manual credit added by the Owner appears in `ledger_entries` with its unique reference note.
- [ ] Displayed stats and CSV export match `ledger_entries` and `free_views_used` with zero discrepancy.
- [ ] Zero payment card data is stored or accepted anywhere in Rada.

---

## Slice 6d: Video Ads

- [ ] Confirm `O3` (Video hosting & transcoding provider ADR) is approved.
- [ ] Implement video upload, MIME/malware check, size and ≤ 60-second duration enforcement, poster extraction, transcoding, and mandatory `.vtt` captions verification in `src/lib/ads/media`.
- [ ] Add Video playback renderer in `src/features/ads/watch` (muted start, default captions on, visible pause/skip/close, zero third-party player tracking code).
- [ ] Document the operational cost per hour of video ads in `docs/architecture/ads-pipelines.md`.

### Exit Criteria — Slice 6d
- [ ] A 60-second video ad plays smoothly on a mid-range phone over 4G with synchronized captions.
- [ ] Playwright network check proves zero third-party scripts or pixels load during video playback.
- [ ] Cost per hour of hosted/streamed video ads is documented.
