# Advertising Policy, Creative Specifications & Review Checklist

*Source: Sections 3, 8.8–8.11, and 15 of the Rada Build Plan.*
*Protected by `CODEOWNERS` (Owner approval required for any change).*
*Status: **Draft** — Final confirmation of restricted categories and checklist is tracked as open item `O2` in [`docs/product/open-questions.md`](./product/open-questions.md) and blocks Phase 6b.*

---

## 1. Core Principles (`D7`, `D16`–`D24`, Rules 17–21)

1. **Voluntary Destination Only (`D7`, `D16`):** Ads live **exclusively** in the Watch Ads tab. Ads are never shown in the Discovery Feed, My Catalogues, Calendar, or Portfolios, and never use pop-ups, interstitials, or forced countdowns.
2. **Informative or Entertaining (`D17`):** People visit Watch Ads of their own free will. Every ad must be genuinely informative or entertaining so viewers choose to watch it.
3. **Zero Viewer Compensation (`D16`, Rule 18):** Viewers receive no points, credits, money, perks, or rewards for watching ads, and Watch Ads is never framed as "supporting the site".
4. **Human Review Before Live (`D20`):** Every advertiser account and every ad creative (including any edit to a previously approved ad) is reviewed by a human reviewer before going live. Target review turnaround: **2 business days**.
5. **One Free Allowance Per Business & Website (`8.9`, `8.10`):** Each approved business and website receives one initial free allowance of qualified views. Duplicate accounts for the same business or domain are rejected.
6. **First-Party Privacy (`D18`, `D22`, Rule 20):** No third-party ad networks, tracking pixels, iframes, or scripts are permitted in Rada or inside ad creatives.

---

## 2. Allowed MVP Ad Formats & Technical Limits (`D21`, `8.9`)

Every ad requires:
- `title`: max **80 characters** (`NOT NULL`)
- `description`: max **280 characters** (`NOT NULL`)
- `cta_label`: concise call-to-action button label (`NOT NULL`)
- `cta_url`: valid `https://` destination URL (`NOT NULL`, routed via `/r/:adId` with `rel="noopener noreferrer"`)
- `category_id` and `subcategory_id`: valid taxonomy pair from `data/taxonomy.json` (`NOT NULL`)

### 2.1 Format 1: Story (`Phase 6a`)
- **Structure:** **1 to 5 image slides** presented sequentially with text and a single Call to Action.
- **Image Asset Requirements (`ad_assets` with `kind = 'image'`):**
  - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp` (no animated GIFs or SVGs containing scripts).
  - Maximum file size per slide: **2 MB** (`2,097,152` bytes) *(proposed default; confirm in `O2`)*.
  - Recommended aspect ratio: `9:16` vertical or `4:5` portrait / `1:1` square.
  - **Mandatory Accessibility:** Every slide image **must** include non-empty, descriptive `alt_text`.

### 2.2 Format 2: Video (`Phase 6d` — requires `O3` ADR first)
- **Structure:** **1 video file** of up to **60 seconds** duration, accompanied by **1 poster image** (`kind = 'poster'`) and **1 captions file** (`kind = 'caption'`).
- **Video & Caption Requirements:**
  - Maximum duration: **60 seconds** (`duration_s <= 60`).
  - Maximum file size & transcoding parameters: Defined in the Phase 6d Video Hosting ADR (`O3`).
  - **Mandatory Accessibility:**
    - A valid WebVTT (`.vtt`) captions file (`kind = 'caption'`) is required for every video ad.
    - Poster image (`kind = 'poster'`) requires `alt_text` and is hidden (zero network request) when the viewer has `thumbnails_hidden` enabled (`O7` default).
    - Playback starts **only** when the viewer taps play, with sound muted by default, captions on by default, and pause/skip/close controls always visible.

---

## 3. Restricted & Prohibited Categories (Draft Proposal — `8.11`)

Ads in any of the following categories are **prohibited** on Rada:

1. **Adult & Sexually Explicit Content:** Pornography, adult services, or sexually explicit imagery/text.
2. **Gambling & Betting:** Online casinos, sports betting, lotteries, or real-money games of chance.
3. **Tobacco, Nicotine & Vaping:** Cigarettes, cigars, e-cigarettes, vapes, or related paraphernalia.
4. **Weapons, Ammunition & Explosives:** Firearms, knives marketed as weapons, ammunition, or explosives.
5. **Political, Campaign & Election Ads:** Ads for political candidates, parties, ballot measures, or lobbying campaigns.
6. **Deceptive or High-Risk Financial Products:** Get-rich-quick schemes, guaranteed financial returns, unregulated crypto/forex promotions, or predatory lending.
7. **Illegal Goods, Services, or Unverified Medical Claims:** Anything illegal in the launch region or target region, counterfeit goods, or unsubstantiated health/medical cures.
8. **Malware, Spyware, or Deceptive Landing Pages:** Links that trigger downloads, phishing, or deceptive dark patterns.

---

## 4. Rules on Claims & Disclosure

- **Clear Advertiser Identity:** The advertiser's verified business name is displayed clearly on every ad card alongside an explicit **`Ad`** badge (`8.8`).
- **Substantiated Claims:** All factual, pricing, or performance claims in the ad title, description, or slides/video must be accurate and verifiable on the destination landing page.
- **Destination Consistency:** The `cta_url` must lead directly to the advertised business's own website (matching or demonstrably affiliated with `advertisers.website`), without intermediate third-party tracking redirects.

---

## 5. Human Reviewer Checklists (`8.10`)

### 5.1 Advertiser Onboarding Review Checklist (`PATCH /api/admin/advertisers/:id`)
- [ ] **Verified Email & Identity:** Contact email is verified and business name is legitimate.
- [ ] **Working Business Website:** `website` loads over HTTPS and represents a real, active business outside Prohibited Categories.
- [ ] **Free Allowance Deduplication (`8.9`):** Confirmed neither this business entity nor this website domain has previously been granted a free qualified-view allowance.

### 5.2 Ad Creative Review Checklist (`PATCH /api/admin/ads/:id`)
Every item below is recorded in `ad_reviews.checklist` (JSON) before an ad can transition from `in_review` to `approved`:
- [ ] **1. Advertiser Identity Clear:** Advertiser name and branding match the approved advertiser profile.
- [ ] **2. Claims Not Misleading:** No deceptive promises, fake urgency, or unsubstantiated claims.
- [ ] **3. No Restricted Category:** Creative and landing page do not touch any prohibited category in Section 3.
- [ ] **4. Accurate Taxonomy:** Assigned `category_id` and `subcategory_id` accurately match the ad's subject matter.
- [ ] **5. Captions & Alt Text Present:** Every Story slide has accurate `alt_text`; every Video has an accurate synchronized captions file and poster `alt_text`.
- [ ] **6. Destination Link Works:** `cta_url` resolves cleanly over HTTPS and matches the ad's offer.
- [ ] **7. Zero Tracking Scripts:** Creative assets and `cta_url` contain no embedded tracking pixels, third-party scripts, or spyware.
- [ ] **8. Informative or Entertaining (`D17`):** Creative provides genuine information or entertainment suitable for voluntary viewing.
