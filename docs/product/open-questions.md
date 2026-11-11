# Open Questions (`TBD` — Do Not Build)

*Source: Section 3 of the Rada Build Plan.*
*Per `AGENTS.md` Rules 3 and 4: **Never build, stub, or mock `TBD` items.** If you encounter a new ambiguity during implementation, log it here, open a `needs-decision` issue, and work on an unrelated task.*

---

## 1. Phase 6 Blockers (Watch Ads & Advertiser Portal)

Phase 6 (`docs/phases/phase-6.md`) **must not start** until the dependencies below are answered and recorded in [`docs/product/decisions.md`](./decisions.md):

- [ ] **O1 — Free allowance and fee parameters (Blocks Phase 6a/6c & first advertiser approval):**
  - Exact number of free qualified views granted per approved advertiser (`free_views_granted`).
  - Fee per qualified view (`price_per_qualified_view_cents`) after the free allowance is exhausted.
  - Minimum top-up credit (`min_topup_cents`) and default daily spend caps (`daily_cap_cents`).
  - *Note:* Stored as runtime configuration (`rate_cards` / admin config), but initial values must be set before the first advertiser is approved because they are part of the advertiser terms of service.
- [ ] **O2 — Final Ad Policy & Review Checklist (Blocks Phase 6b):**
  - Owner confirmation of the final restricted ad categories and human review checklist drafted in [`docs/ad-policy.md`](../ad-policy.md).
- [ ] **O3 — Video Hosting & Transcoding Provider (Blocks Phase 6d):**
  - Choice of storage/transcoding provider, cost limits per hour of video ads, and verification that it loads zero third-party tracking/client code. Requires an ADR before starting Phase 6d.
- [ ] **O4 — Legal & Commercial Terms (Blocks first paid advertiser):**
  - Advertiser Terms of Service.
  - Ad disclosure regulations in launch countries.
  - Advertiser refund policy.

---

## 2. Deferred Post-Launch Items (Do Not Build in MVP)

- [ ] **O5 — Self-Serve Payment Provider (`D24`):**
  - Not needed at launch (payments are agreed offline and credited manually by the Owner). Decide later only if self-serve top-ups become worthwhile, choosing a provider that supports hosted checkout in the Owner's and advertisers' countries.
- [ ] **O6 — Third-Party Network Ads / AdSense (`D18`):**
  - Deferred until Rada has real content and traffic. Before adding any network, verify its policies on ad-only screens, voluntary viewing, user consent, and third-party scripts, and isolate any script strictly to the Watch Ads page.

---

## 3. Product & Operational Defaults Awaiting Owner Confirmation

- [ ] **O7 — Hide thumbnails behaviour on ad posters:**
  - Whether enabling `thumbnails_hidden` also hides ad poster images in Watch Ads.
  - *Documented default:* **Yes** (hide ad posters and make zero poster image requests when thumbnails are hidden).
- [ ] **O8 — Anonymous survey picks when signup is skipped:**
  - Whether anonymous survey suggestions are retained for moderation when the respondent skips account creation at the end of the survey.
  - *Documented default:* **Kept without a name**, clearly disclosed on the survey consent/summary screen (with an explicit "Delete my answers" option also provided).
- [ ] **O9 — User signup method:**
  - Primary authentication mechanism.
  - *Documented default:* **Email magic link** via Auth.js.
- [ ] **O10 — Launch environment & external configuration:**
  - **Launch region** for filtering "Local" items.
  - **Product domain** (`<domain>`).
  - **Repository licence** (`LICENSE`).
  - **AI provider** for the Phase 4 portfolio copy assistant (behind `src/lib/ai`).
  - **Hosting platform** for application and PostgreSQL database.
- [ ] **O11 — Pre-launch survey distribution:**
  - Channels and outreach strategy for reaching pre-launch survey respondents.
