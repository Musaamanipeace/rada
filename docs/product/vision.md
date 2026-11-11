# Product Vision, Glossary, Feature Requirements & Risks

*Source: Rada Build Plan, Agent Rules and Skills (Draft v3 · 11 November 2026).*

## 1. Product Summary

Rada is a simple, cross-platform web app (an installable PWA) for discovering things to do online and offline.

### Core Application Areas

1. **Content Suggestion:** An endless, virtualized discovery scroller across 10 categories, 34 subcategories, and curated topics, paired with **My Catalogues** for saved items.
2. **Calendar:** Desktop month view and mobile agenda view for dated items and personal events, with reminders, completion history, and `.ics` export.
3. **Portfolio:** A personal portfolio builder (`<domain>/<username>`) with templates, live preview, and an opt-in AI copy assistant.
4. **Watch Ads:** A voluntary, user-initiated destination where people choose to watch informative or entertaining short stories or videos—never mixed into the feed or other tabs, and behind an off-by-default switch at launch (`D23`).
5. **Become an Advertiser:** A business portal for onboarding advertisers, building campaigns, reviewing aggregated performance stats, and managing prepaid balances.
6. **Public Landing Page:** Hero CTA, 3-step how-it-works overview, category preview, example portfolios, and an "Advertise with us" entry point.

**Guiding Principle:** The experience must stay simple.

---

## 2. Glossary

- **Category / Subcategory / Topic:** Levels 1, 2, and 3 of the taxonomy (10 categories, 34 subcategories, and exact topics defined in [`docs/taxonomy.md`](../taxonomy.md) and [`data/taxonomy.json`](../../data/taxonomy.json)).
- **Item:** One suggested piece of content, stored as a link plus metadata—never the content itself.
- **Variety mode:** A feed mode that mixes all categories, including ones outside the user's stated interests.
- **Interest:** A subcategory the user said they care about.
- **Interaction:** An in-app action on an item (`open`, `save`, `unsave`, `calendar_add`, `dismiss`).
- **Seed library:** The first approved items, sourced from hand curation and the pre-launch survey.
- **Ad:** A short story or video made by an advertiser and shown **only** in the Watch Ads tab. Ads are not items and never appear in the feed.
- **Advertiser and campaign:** An advertiser is a business account; a campaign groups ads with a budget, schedule, and targeting.
- **Qualified view:** A view that meets the playback threshold (5 seconds of playback or 50% of the ad, whichever comes first; configurable); the unit advertisers pay for.

---

## 3. Feature Requirements

### 3.1 Feed (`8.1`)

- **Header controls:**
  - Scrollable category chips (multi-select; none selected defaults to the user's stated interests).
  - A **Variety** chip (toggles Variety mode).
  - Filter toggles for **Free/Paid**, **Upcoming**, and **Local**.
  - **Hide thumbnails** toggle.
- **Item card:**
  - Thumbnail (hideable), title, source name, category tag, cost badge, date (if dated), and action buttons: **Save**, **Open** (opens in new tab with `rel="noopener noreferrer"`), **Not interested** (dismiss), plus **Add to calendar** on dated items only.
- **Scrolling & states:**
  - Endless scroll with list virtualization (`@tanstack/react-virtual`).
  - Loading state displays skeleton cards.
  - When fresh items run out, recycle unsaved, non-dismissed items in shuffled order—**never show a dead end**.
  - Empty filter results display a **Clear filters** button.
  - Past-dated items drop out of the feed automatically.
- **Onboarding:**
  - Prompts new users to pick at least 3 interests (subcategories) and is skippable (skipping defaults to Variety mode).

### 3.2 Hide Thumbnails (`8.2`)

- Available as a toggle in the feed header and in user settings.
- **Zero-request guarantee:** When turned on, **no image is requested over the network at all**; cards render a compact text and category-icon layout.
- Applies to the Feed and My Catalogues (and ad posters in Watch Ads per default in [`open-questions.md`](./open-questions.md)), not to user portfolios.
- Syncs to the user account when logged in; stored locally on the device for guests. Default: **off**.

### 3.3 My Catalogues (`8.3`)

- Ten category shelves that expand into subcategories; empty shelves are greyed out.
- Users can un-save items at any time.
- Dated items retain the **Add to calendar** action.
- Readable offline from local/service-worker cache.
- Guest saves merge automatically into the user's account upon signup.
- Custom user-named collections are out of scope for the MVP.

### 3.4 Calendar (`8.4`)

- **Views:** Month view on desktop, agenda view on phones.
- **Actions:** Create, edit, and delete events manually or directly from a dated item (`source_item_id`).
- **Source date changes (`D12`):** Calendar entries keep a link to the source item; if a source item's date changes, show a notice instead of silently editing the user's calendar entry.
- **Reminders & history:** Configurable reminder minutes; marking an event **Done** records `done_at` and moves it into the user's activity history.
- **Portability:** `.ics` export (`GET /api/calendar.ics`) ships in the MVP; import is deferred.
- **Offline:** Readable offline in read-only mode.

### 3.5 Pre-Launch Survey (`8.5`)

- **Flow:**
  1. Welcome screen with required consent checkbox.
  2. Choose categories (at least one).
  3. One screen per subcategory within the chosen categories, allowing up to 3 suggestions or **Skip**.
  4. Progress is saved automatically so the respondent can finish at any time.
  5. Summary and signup prompt with three explicit choices: **Keep my picks & create an account**, **Skip signup**, or **Delete my answers**.
  6. Thank-you screen with a shareable link.
- **Suggestion fields:**
  - `title_or_url` (required)
  - `pick_type`: `useful` | `impactful` | `favorite` (required)
  - `topic_id` (optional)
  - `note` (optional, max 140 characters)
  - Category and subcategory are inherited from the active screen, guaranteeing nothing arrives uncategorised.
- **Moderation & copy rules:**
  - Nothing goes live automatically; a human reviewer approves, rejects, or merges duplicates.
  - Merged duplicates increment `popularity_count` on the canonical item.
  - UI copy must state **"submitted for review"**, never *"added to the library"*.
- **Anti-abuse & targets:**
  - Maximum 3 suggestions per subcategory, one response per email, honeypot/spam trap, and endpoint rate limits.
  - Launch target: at least **10 approved items per subcategory** (340+ items minimum across 34 subcategories) before launch, topped up by hand curation.

### 3.6 Portfolio MVP (`8.6`)

- **Content:** Profile (headline, intro, avatar), 1–3 projects, and ordered links, each with a `hidden` toggle.
- **Customization & editing:** Choice of 3 templates, theme support, live desktop and mobile preview, autosave, quick-start flow, and completion checklist.
- **Publishing:** Publish and unpublish controls, public URL at `<domain>/<username>`, and visibility states: `draft`, `public`, or `unlisted`. Drafts must be unreachable publicly.
- **AI Assistant:** Suggests headlines and descriptions only (behind `src/lib/ai`); the user must explicitly approve every change.
- **Deferred (Post-MVP):** Additional custom sections, testimonials, custom domains, portfolio analytics.

### 3.7 Landing Page (`8.7`)

- Hero section with a single primary call to action.
- Three-step "How it works" explanation.
- Interactive or visual category preview.
- Example public portfolios.
- "Advertise with us" link and standard footer (including plain-language Privacy link).

### 3.8 Watch Ads — Viewer Side (`8.8`)

- **Voluntary destination (`D16`, `D17`, `D23`):** Nothing in Watch Ads loads media or plays until the viewer opens the tab and taps play. No ad appears anywhere else in Rada. While the Watch Ads switch is off (the launch default), the tab is hidden and its endpoints return `404`.
- **Browse:** List of ad cards filterable by the 10 category chips and sortable by **Newest** or **Popular** (most qualified views in the last 7 days). Each card displays an `Ad` badge, advertiser name, title, duration, category tag, and poster image (hidden with zero network request when `thumbnails_hidden` is on).
- **Play:** Tap to start. Sound is muted until the viewer turns it on; captions are on by default; pause, skip, and close are always available. No forced watching and no countdown timers.
- **After playing:** A call-to-action button opens the advertiser's URL in a new tab with `rel="noopener noreferrer"`, routed through `/r/:adId` so the click is counted first-party. "Play next" is offered, with autoplay of the next ad **off by default**.
- **Viewer controls:** **Not interested**, **Hide this advertiser**, and **Report** on every ad, taking effect immediately and persisted in `viewer_ad_prefs` (device storage for guests, merged on signup).
- **Empty & error states:** No matches shows a **Clear filters** button; media load errors show a **Retry** button.

### 3.9 Become an Advertiser — Business Portal (`8.9`)

- **Onboarding:** Sign up, verify email, and submit business name, website, and contact email. A reviewer approves the advertiser before any campaign can go live. Each business and website receives one free allowance only.
- **Campaign builder:** Guided flow with autosave as `draft`:
  1. Name & schedule (`start_at`, `end_at`)
  2. Targeting (`category_ids`, optional `regions`)
  3. Budget & daily cap (`budget_cents`, `daily_cap_cents`)
  4. Creative (**Story**: 1–5 images with required `alt_text`, title max 80, description max 280, CTA; **Video** in Phase 6d: up to 60s video with poster image and required captions file)
  5. Review & submit (`in_review`)
- **Free allowance & prepaid balance (`D19`, `D24`):**
  - Approved advertisers use their free qualified-view allowance first. When exhausted, the campaign pauses and the advertiser is notified by email.
  - Subsequent views are billed from a prepaid balance at the active `rate_card`.
  - At launch, payments are agreed offline with the Owner, who adds credit manually via an admin screen (`POST /api/admin/advertisers/:id/credit`); advertisers can submit a top-up request from the portal.
- **Reporting & controls:** Daily stats (impressions, qualified views, completion rate, clicks, CTR, free vs. paid views, spend) with CSV export. Category breakdowns are shown only when the audience threshold (default 20 qualified views) is met. Advertisers can pause, resume, end, or duplicate campaigns, request top-ups, and view their ledger.

---

## 4. Risks & Mitigations (`Section 16`)

| Risk | Mitigation |
| :--- | :--- |
| Thin library or low survey response | Hand-curate a base seed library; track coverage per subcategory (target ≥10 per subcategory before launch) |
| Source licensing limits | Check and record licence terms in `docs/sources.md` before building each connector; maintain a global and per-connector kill switch |
| Stale dated content | Auto-expire past items; show a notice on calendar events when source dates change (`D12`) |
| Spam or low-quality suggestions | Human review queue, endpoint rate limits, spam trap, one survey response per email, max 3 per subcategory |
| Scope creep from unfinished decisions | Strict phase exit gates; `AGENTS.md` Rules 3 and 4 |
| Slow endless list | Virtualization (`@tanstack/react-virtual`) and a CI-enforced JS and frame-rate performance budget |
| Privacy drift | `AGENTS.md` Rule 6 and a Playwright e2e test that fails the build on any undeclared third-party network request |
| Agent invents features | Decision log (`docs/product/decisions.md`), locked-status table, `AGENTS.md` Rule 1 |
| Few people choose to watch ads, so advertisers see little value | Ad policy requires informative or entertaining creative; category filters; honest stats; start with a few hand-recruited advertisers |
| No advertisers at launch | Watch Ads stays off (`D23`) until the first advertiser is approved; the free allowance helps attract early advertisers |
| Free allowance abused with duplicate accounts | One allowance per business and website, verified by human reviewer; flag repeat domains |
| Harmful or misleading ads | Human review before launch, strict `docs/ad-policy.md`, viewer Report button, automatic pause on repeated reports |
| Billing errors or disputes | Integer cents only, append-only ledger with unique `ref`, idempotent event ingestion, nightly reconciliation check, refund/adjustment entries |
| Manual payments get messy | Every credit goes through the Owner admin screen with a mandatory reference note and appears in `ledger_entries`; add hosted payment provider later only if volume grows |
| Invalid or inflated views | Rate limits, max one billable view per owner per ad per 24 hours, ability to issue adjustment/refund credits |
| Video hosting cost and third-party code | Mandatory ADR before Phase 6d; strict size and 60s length limits; documented cost per hour of ads |
| Legal duties for taking payments | Resolve legal items in `docs/product/open-questions.md` before onboarding the first paid advertiser |
