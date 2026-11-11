---
name: add-ad-format
description: Use in Phase 6 when adding or extending an ad creative format (such as Story or Video) in Watch Ads and the Advertiser portal.
---

# Add Ad Format (`add-ad-format`)

Follow these steps when implementing or adding an ad creative format (Phase 6 only, after Phase 6 prerequisites in `docs/product/open-questions.md` are resolved):

1. **Define policy & file limits in `docs/ad-policy.md`:**
   - Document allowed MIME types, maximum file size (bytes), dimensions, aspect ratios, slide counts (e.g., 1–5 slides for Story), or duration limits (e.g., max 60s for Video).
   - Require `alt_text` on every image asset and a captions file (`kind = 'caption'`) plus poster image (`kind = 'poster'`) on every video asset.
   - Note that changes to `docs/ad-policy.md` require Owner approval (`CODEOWNERS`).
2. **Add Zod validation & database constraints:**
   - Validate creative metadata (`title` max 80, `description` max 280, `cta_label`, `cta_url`, required `category_id` and `subcategory_id`) and required `ad_assets` in `src/lib/ads/policy` and `src/lib/ads/media`.
   - Ensure an ad cannot transition to `in_review` until all required assets pass type, malware, size, duration, and accessibility checks.
3. **Implement upload & media pipeline (`src/lib/ads/media`):**
   - Use signed upload URLs (`POST /api/advertiser/assets`).
   - Reject any creative containing scripts, HTML embeds, or third-party tracking pixels.
4. **Implement Watch Ads renderer (`src/features/ads/watch`):**
   - **No preloading before tap:** Media must not load or play until the viewer opens Watch Ads and explicitly taps play on the ad.
   - **Playback controls:** Sound off by default until viewer enables it; captions on by default; pause, skip, and close controls always available; no countdowns or forced watching.
   - **Thumbnail toggle respect:** Hide poster images and make zero poster image requests when `thumbnails_hidden` is on.
   - **First-party CTA redirect:** Route CTA clicks through `/r/:adId` (`rel="noopener noreferrer"`, new tab) with only the ad ID attached—never viewer identifiers.
5. **Update the reviewer checklist (`src/features/ads/review` & `docs/ad-policy.md`):**
   - Add format-specific verification checks to the human review screen.
6. **Write tests:**
   - Unit tests for asset validation and state transitions.
   - Playwright + axe tests proving: zero media requests before tap-to-play, captions active, keyboard controls working, and sound muted on start.
