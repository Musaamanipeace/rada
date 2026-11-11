# Privacy Rules & Data Governance Specification

*Source: Section 9 of the Rada Build Plan.*
*Protected by `CODEOWNERS` (Owner approval required for any change).*

---

## 1. Privacy Hard Limits (`LOCKED` — `D8`, Rule 6)

These limits are non-negotiable architectural invariants enforced across code review and automated Playwright tests:

1. **Zero Third-Party Tracking:** No third-party analytics, ad pixels, telemetry SDKs, or device fingerprinting anywhere in Rada.
2. **Never Read Browser History or Cache:** Rada never reads or inspects browser history, third-party cookies, or browser cache for tracking or personalization (`D8`).
3. **First-Party Storage Only:** Only first-party session storage and first-party cookies/localStorage are used for login sessions, UI preferences (`thumbnails_hidden`), and guest identity tokens (`anon_sessions`).
4. **Strict Data Minimization — What We Collect:**
   - Account email (`users.email`) and optional display name
   - Explicitly stated subcategory interests (`user_interests`)
   - In-app interactions (`open`, `save`, `unsave`, `calendar_add`, `dismiss`)
   - Pre-launch survey responses (`survey_sessions`, `survey_suggestions`)
   - User-created calendar entries and portfolio content
   - **Nothing else.**
5. **User Data Rights (`GET | DELETE /api/me/data`):**
   - Users can view, export (JSON), and permanently delete all of their interactions and account data at any time.
   - Guest signals stay on the device / anonymous token until claimed on signup.
6. **Explicit Location Only:** Location is **only** a region string that the user types or explicitly allows—never inferred silently from IP addresses, GPS, or browser APIs.
7. **Plain-Language Privacy Page:** A plain-language `/privacy` page reflecting these exact rules must ship in **Phase 1** before the pre-launch survey goes live.
8. **Zero Undeclared Outbound Requests:** Any new outbound network request from the client or server requires an Architecture Decision Record (ADR). A Phase 2 Playwright test fails the build if the client makes any undeclared third-party network request.

---

## 2. Advertising Data Rules (`PROPOSED` — `D18`, `D22`, Rule 20)

When Watch Ads is enabled in Phase 6:

1. **First-Party Ad Events Only:**
   - Ad playback and interaction events are first-party only and stored in `ad_events`.
   - Zero third-party SDKs, pixels, or tags are loaded by Rada, and advertisers are strictly prohibited from embedding tracking scripts, iframes, or pixels in ad creative.
2. **Strict Separation of Feed Signals & Ad Targeting (`D22`):**
   - Ad targeting uses **only** the categories a viewer actively chooses to browse inside the Watch Ads tab and an optional region the viewer set.
   - Discovery feed interactions (`interactions`), saved items (`saved_items`), and feed onboarding interests (`user_interests`) are **never** used to target ads and **never** shared with advertisers.
3. **Aggregates Only & Minimum Audience Threshold:**
   - Advertisers see aggregated daily statistics (`ad_stats_daily`) only.
   - Category breakdowns are hidden below a minimum audience size (**default: 20 qualified views**).
   - Viewer identities, email addresses, IP addresses, and browsing histories are **never** shared with advertisers.
4. **Raw Ad Event Retention (`90 Days`):**
   - Raw rows in `ad_events` are retained for **90 days** for deduplication, billing reconciliation, and abuse investigation, after which they are purged and only daily aggregates in `ad_stats_daily` remain.
5. **First-Party Click Redirects (`/r/:adId`):**
   - Clicking an ad's Call to Action routes through `/r/:adId`, opens in a new tab with `rel="noopener noreferrer"`, and appends **only** the `adId` to the advertiser's destination URL—never any viewer identifier or session token.
6. **Zero Card Data Storage (`D24`, Rule 19):**
   - Rada servers never receive, process, or store payment card numbers. At launch, advertiser credits are handled offline and recorded manually by the Owner. If a payment provider is added later, card details are handled exclusively by the provider's hosted checkout.
