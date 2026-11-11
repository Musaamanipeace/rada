# Architecture Overview, Ranking Rules & Non-Functional Requirements

*Source: Sections 5, 8.11, 9, 10, and 12 of the Rada Build Plan.*

## 1. Architectural Style & Technology Stack (`Section 5`)

Rada is built as a **single modular monolith** organised by feature, confirmed or adjusted via [ADR-0001](./adr/0001-stack.md) during Phase 0.

- **Framework & Language:** Next.js (App Router), TypeScript (`strict: true`), Tailwind CSS.
- **Database & Validation:** PostgreSQL with Prisma ORM and append-only migrations kept in the repository (`prisma/migrations/`). Zod validation at every boundary (API inputs, imports, environment variables).
- **Authentication & Sessions:** Auth.js with email magic link. Guests receive a first-party anonymous session token (`anon_sessions`), claimed and merged into their user account upon signup.
- **Client State & Virtualization:**
  - **TanStack Query** for server state and caching.
  - **Zustand (persisted)** for UI preferences (active filters, `thumbnails_hidden` toggle).
  - **`@tanstack/react-virtual`** for high-frame-rate virtualization of the endless discovery feed.
- **PWA & Offline Support:** **Serwist** for the service worker and web app manifest, providing offline read-only access to **My Catalogues** and **Calendar**.
- **Testing & Quality Tooling:**
  - **Vitest** for unit, ranking, state-machine, billing idempotency, and database constraint tests.
  - **Playwright** for end-to-end user flows, zero-image-request checks (`thumbnails_hidden`), and zero-undeclared-outbound-request checks.
  - **`@axe-core/playwright`** for automated WCAG 2.2 AA accessibility verification.
  - **ESLint**, **Prettier**, **`pnpm`**, and **GitHub Actions** CI.
- **AI Abstraction:** AI copy suggestions for the Phase 4 Portfolio assistant sit strictly behind an interface in `src/lib/ai` so the underlying provider can change without touching feature code.
- **Observability:** First-party logging only. Zero third-party analytics, pixels, or telemetry SDKs.

---

## 2. Repository & Module Boundaries (`Sections 8.11 & 12`)

```text
src/
├── app/                     # Next.js App Router pages, layouts, and API route handlers
├── features/                # Feature modules (UI components, hooks, client state)
│   ├── feed/                # Endless discovery scroller, filters, onboarding interests
│   ├── catalogues/          # My Catalogues (10 category shelves, offline cache)
│   ├── calendar/            # Desktop month & mobile agenda views, reminders, .ics
│   ├── portfolio/           # Portfolio editor, 3 templates, preview, publish flow
│   ├── survey/              # Pre-launch survey flow & Reviewer moderation queue
│   └── ads/                 # Phase 6 only (gated by Watch Ads switch D23)
│       ├── watch/           # Viewer UI (Watch Ads tab)
│       ├── advertiser/      # Advertiser portal UI & campaign builder
│       └── review/          # Human reviewer UI for advertisers & ad creatives
└── lib/                     # Domain logic, database access, and isolated services
    ├── ai/                  # Provider-agnostic AI interface for portfolio copy
    ├── ranking/             # Feed ranking v1 (weights in src/lib/ranking/weights.ts)
    └── ads/                 # Phase 6 domain pipelines (public interfaces only)
        ├── serving/         # Eligible ad selection, rotation & interest/region matching
        ├── events/          # First-party event ingestion, dedupe & rate limiting
        ├── billing/         # Free allowance, ledger entries, aggregation & reconciliation
        ├── media/           # Signed uploads, asset checks, poster & captions validation
        └── policy/          # Ad policy rules, restricted categories & state machine
```

> **Boundary Rule (`8.11`):** External code may interact with any `features/ads/*` or `lib/ads/*` module **only through its public interface** (`index.ts`).

---

## 3. Feed Ranking v1 (`Section 9`)

All ranking weights live in a single canonical file: `src/lib/ranking/weights.ts` (protected by `CODEOWNERS`).

### 3.1 Scoring Components

1. **Interest Match Weights:**
   - Exact **Topic** match: `+1.0`
   - **Subcategory** match (`user_interests`): `+0.7`
   - **Category** match: `+0.4`
2. **Interaction Signals (decaying over 30 days):**
   - `save`: `+3`
   - `calendar_add`: `+3`
   - `open`: `+1`
   - `dismiss`: `-3` (plus hard exclusion—never show a dismissed item again)
3. **Boosts:**
   - Small **popularity boost** from `items.popularity_count`.
   - **Freshness boost** for upcoming dated items (`starts_at > now`).

### 3.2 Batch Composition & Exclusions

- **Exploration quota:** Reserve approximately **15% of every 20-item batch** for approved items outside the user's stated interests.
- **Variety Mode (`D3`):** Ignores user interests and cycles evenly across all 10 categories.
- **Hard Exclusions:**
  - Never repeat an item within the same browsing session.
  - Never show a `dismiss`ed item again to that owner.
  - Never show already-saved items (`saved_items`) in the discovery feed.
  - Automatically drop past-dated items (`ends_at < now`, or `starts_at < now` when `ends_at` is null).
- **Exhaustion Recycling (`8.1`):** When fresh eligible items run out, recycle unsaved, non-dismissed items in shuffled order so the feed never hits a dead end.

---

## 4. Non-Functional Requirements (`Section 10`)

Accessibility and performance budgets are mandatory requirements (`AGENTS.md` Rule 13), not optional polish.

| Area | Requirement | Verification |
| :--- | :--- | :--- |
| **Performance — LCP** | Largest Contentful Paint (LCP) **< 2.5 s** on a mid-range phone over 4G | Lighthouse / Playwright performance check |
| **Performance — Scroll FPS** | Feed sustains **≥ 55 fps** with 2,000 items scrolled | Virtualization (`@tanstack/react-virtual`) + benchmark |
| **Performance — JS Budget** | Set explicit client JS bundle budget in Phase 0 and enforce in CI | CI build check |
| **Performance — Ad Media** | Ad media loads **only after** the viewer opens Watch Ads and taps play | Playwright network interception test |
| **Accessibility** | **WCAG 2.2 AA** compliance, full keyboard navigation, `prefers-reduced-motion` support. Ad videos require captions, visible pause control, and zero autoplay with sound | `@axe-core/playwright` checks in e2e suite |
| **Responsive & PWA** | Responsive from **360 px to 1440 px** viewport width. Installable PWA passing Lighthouse PWA audit; offline mode provides read-only access to **My Catalogues** and **Calendar** | Playwright multi-viewport + offline tests |
| **Security** | Zod validation at every boundary, rate limiting on all public endpoints, CSRF protection, `rel="noopener noreferrer"` on all external links, strict role checks on every `reviewer` and `admin` route | Unit + API security tests |
| **Internationalization (i18n)** | All user-facing strings externalised from day one; English (`en`) shipped at launch | Lint / string catalog check |
| **SEO & Indexing** | **Only** the public landing page (`/`) and public portfolios (`/<username>` with `visibility = 'public'`) are indexable; all other routes emit `noindex` | Metadata / `robots.txt` test |
