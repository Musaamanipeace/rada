# Changelog

All notable changes to Rada are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Phase 2 — Discovery Feed and Onboarding:**
  - **Ranking Engine v1 (`src/lib/ranking/engine.ts`, `src/lib/ranking/weights.ts`):** Canonical weights (topic `1.0`, subcategory `0.7`, category `0.4`); 30-day decaying interaction signals (`save`/`calendar_add` `+3`, `open` `+1`, `dismiss` `-3`); logarithmic popularity boost; upcoming freshness boost for items within 14 days; 15% exploration quota outside stated interests; exhaustion recycling; strict exclusions (dismissed, saved, past-dated, session-seen, ads).
  - **Feed API (`GET /api/feed`):** Cursor pagination (20 items/batch); multi-select category, subcategory, topic, Variety mode, Free/Paid, Upcoming, and Local filters; ad isolation enforced at engine level (Rule 17); rate-limited (60 req/min).
  - **Interaction APIs:** `POST /api/items/:id/save` and `DELETE /api/items/:id/save` (save/unsave with interaction signal); `POST /api/items/:id/dismiss` (idempotent permanent exclusion); `POST /api/interactions` (open, calendar_add signals).
  - **User Preferences APIs:** `GET /api/me/interests` and `PUT /api/me/interests` (atomic replace, minimum 3 subcategories); `GET /api/me/settings` and `PATCH /api/me/settings` (`thumbnails_hidden`, `region`; guests use localStorage).
  - **Onboarding Modal (`src/features/onboarding/OnboardingModal.tsx`):** Accordion by category, subcategory chip multi-select (minimum 3), live count, "Skip — use Variety mode" action, persists via `PUT /api/me/interests`.
  - **Discovery Feed UI (`src/features/feed/`):** Virtualized infinite scroll via `@tanstack/react-virtual`; `FeedHeader` with scrollable category chips, Variety, Free/Paid, Upcoming, Local, and Hide Thumbnails toggles; `FeedItemCard` with thumbnail, cost badge, date badge, Open (new tab, `rel="noopener noreferrer"`), Save, Not Interested, Add to Calendar; recycling banner; skeleton loading; empty state with Clear Filters.
  - **Feed page (`src/app/feed/page.tsx`):** Server component passing `hasInterests` and `isAuthenticated` props to `DiscoveryFeed`.
  - **Hide Thumbnails (`D6`):** When enabled, item cards show category icon instead of thumbnail, making zero external image requests (enforced by Playwright network-interception test).
  - **E2E & Accessibility Tests:** `tests/e2e/feed.spec.ts` (feed renders, filters, save, dismiss, thumbnail zero-image, Rule 17 ad isolation, Rule 6 third-party boundary, WCAG 2.2 AA); `tests/e2e/onboarding.spec.ts` (minimum 3 interests enforcement, skip defaults Variety, PUT interests on completion, WCAG 2.2 AA).
  - **Unit Tests (`tests/unit/ranking-engine.test.ts`):** Dismissed exclusion, saved exclusion, cost filter, category/variety filter, exhaustion recycling, Rule 17 ad invariant.
  - **API documentation updated (`docs/architecture/api.md`):** Added `GET/PUT /api/me/interests`, `GET/PATCH /api/me/settings` contracts.
  - **Phase 2 checklist updated (`docs/phases/phase-2.md`):** All implementation tasks ticked.

- **Offline Survey Workbook & Product/Moderation Documentation:**
  - Added [`docs/offline-survey.md`](docs/offline-survey.md) and [`data/seed/offline-survey.csv`](data/seed/offline-survey.csv) as a standalone offline survey workbook for owner-curated library seeding across all 10 categories, 34 subcategories, and 139 topics.
  - Updated [`docs/content-moderation.md`](docs/content-moderation.md), [`docs/architecture/overview.md`](docs/architecture/overview.md), and [`docs/product/vision.md`](docs/product/vision.md) to document organizing and prioritizing content by `popularity_count` (the number of people who suggested it).
  - Logged open `TBD` product/content decisions in [`docs/product/open-questions.md`](docs/product/open-questions.md): `O12` (canonical source selection for multi-source content), `O13` (suggestions from an individual), `O14` (brand-specific interests deferred to ad onboarding), and `O15` (considered group feature for non-suggestion public discussions).
- **Suggestion Requests Plan (`D27` / Phase 8):**
  - Added Section 3.10 in [`docs/product/vision.md`](docs/product/vision.md), proposed decision `D27` in [`docs/product/decisions.md`](docs/product/decisions.md), open question `O16` in [`docs/product/open-questions.md`](docs/product/open-questions.md), and the implementation plan in [`docs/phases/phase-8.md`](docs/phases/phase-8.md) for user-submitted Suggestion Requests appearing in the discovery feed.
- **Cost Classification Rule (`D28`):**
  - Documented in [`docs/product/decisions.md`](docs/product/decisions.md), [`docs/content-moderation.md`](docs/content-moderation.md), and [`docs/offline-survey.md`](docs/offline-survey.md) that `free` combines completely free and freemium/partially-free items, keeping the `Free/Paid` filter two-state.
- **Taxonomy Display Name Update (`D29`):**
  - Renamed subcategory `sub-news-articles` (`news-articles`) display name from `News articles` to `News and articles` in [`data/taxonomy.json`](data/taxonomy.json), [`docs/taxonomy.md`](docs/taxonomy.md), [`docs/offline-survey.md`](docs/offline-survey.md), and append-only migration `20261116170300_rename_news_articles_subcategory`.
- **Survey Short Note Length Increase:**
  - Increased `survey_suggestions.note` from 140 to 250 characters via append-only migration `20261116170500_increase_survey_note_to_250`, updated Zod/UI validation and docs (`data-model.md`, `api.md`, `vision.md`, `phase-1.md`, `phase-8.md`).
- **Foundational Seed Library & Sports Taxonomy Update (`D31`):**
  - Added `Sports` (`news-articles-sports`) to `News and articles` (`sub-news-articles`) via append-only migration `20261117110500_add_sports_topic_to_news_articles` (174 topics total).
  - Built parser `scripts/parse-answers.ts` to extract and validate 510 items from [`docs/answers.md`](docs/answers.md) into [`data/seed/seed-library.csv`](data/seed/seed-library.csv) and updated [`data/seed/offline-survey.csv`](data/seed/offline-survey.csv).
  - Imported and approved all 510 library items (536 total approved items in database), meeting the launch target of &ge; 10 items across 24 subcategories.
  - Reclassified sports news items (including BBC Sport Football) to `news-articles-sports`.
  - Upgraded survey topic input in [`src/features/survey/SurveyFlow.tsx`](src/features/survey/SurveyFlow.tsx) with a searchable, typable datalist combobox.
  - Reverted temporary dev-mode survey bypass back to standard 5-per-subcategory limits and `/review` queue approval.
  - Documented unified feed stream architecture, movie/entertainment card handling (`D5`, `D28`, `O18`), and typable topics in [`docs/phases/phase-2.md`](docs/phases/phase-2.md) and [`docs/product/vision.md`](docs/product/vision.md).
- **General / All Topics Option (`D30`):**
  - Added `General / All topics` (`<subcategory-slug>-general`) to all 34 subcategories in [`data/taxonomy.json`](data/taxonomy.json) (173 topics total), [`docs/taxonomy.md`](docs/taxonomy.md), [`docs/phases/phase-2.md`](docs/phases/phase-2.md), and append-only migration `20261116171400_add_general_topic_per_subcategory`.

- **Survey Title & Link Enhancement (Decision D26):**
  - Updated `survey_suggestions` schema to require both `title` and `url` via append-only migration `20261114061500_split_survey_title_and_url`.
  - Refined `/survey` UI to provide dedicated Title and Link/URL input fields with automatic protocol normalization (`http://` / `https://`).
  - Added clickable title preview list with external links in the survey summary screen and moderation reviewer queue (`/review`).
- **Phase 1 (Landing Page, Survey and Review Queue):**
  - Public Landing Page (`/`) with Hero CTA, 3-step &ldquo;How it works&rdquo;, 10-category interactive preview, portfolio showcase, and &ldquo;Advertise with us&rdquo; callout.
  - Plain-language Privacy Policy page (`/privacy`) reflecting zero third-party tracking, first-party storage only, and user data rights.
  - Pre-launch survey interactive flow (`/survey`) with explicit consent, category selection, subcategory suggestion forms, autosave, anonymous/account choice (`O8`), spam trap, and rate limiting.
  - Survey endpoints (`POST /api/survey/sessions`, `PUT /api/survey/sessions/:id/suggestions`, `POST /api/survey/sessions/:id/finish`, `POST /api/survey/sessions/:id/claim`).
  - Content reviewer moderation queue (`/review`) and endpoints (`GET /api/admin/review-queue`, `PATCH /api/admin/review-queue/:id`) to approve, reject, merge duplicates, and enforce valid Level-3 topics.
  - Subcategory coverage dashboard tracking progress across all 34 subcategories toward launch threshold of &ge; 10 items per subcategory.
  - CSV Seed Importer (`scripts/import-seed-csv.ts`) implementing the `import-content` skill, strictly rejecting unmapped/partially categorised rows, deduplicating URLs, and auto-expiring past events.
  - Complete Playwright E2E and Axe WCAG 2.2 AA accessibility audit test suite covering landing, survey, and privacy flows.
- **Phase 0 (Foundations):**
  - Modular monolith architecture setup with Next.js 14 (App Router), TypeScript (strict mode), and Tailwind CSS.
  - PostgreSQL schema and Prisma migrations with composite taxonomy foreign key constraints (`category_id`, `subcategory_id`, `topic_id`).
  - Canonical taxonomy seed script (`pnpm db:seed`) and automated validation suite (`pnpm test:taxonomy`) verifying 10 categories, 34 subcategories, and 139 topics.
  - Auth.js with email magic link and first-party anonymous guest token session handling (`anon_sessions`).
  - Responsive App Shell (360 px to 1440 px), accessible keyboard landmarks, WCAG 2.2 AA skip-links, and Watch Ads feature gate (`D23`).
  - Light and dark theme tokens and externalised i18n string dictionary (`en`).
  - Serwist service worker (`src/app/sw.ts`) and installable PWA web manifest.
  - Vitest test suite, Playwright + `@axe-core/playwright` accessibility integration, bundle budget enforcement, and markdown link validation.
  - Confirmed ADR-0001 (Modular Monolith Technology Stack).
- Repository scaffold, directory layout, and GitHub templates (`CODEOWNERS`, PR template, issue templates, CI workflow skeleton).
- Agent rules (`AGENTS.md`), contributor workflow (`CONTRIBUTING.md`), and all 11 agent skills in `.agents/skills/`.
- Product documentation (`docs/product/vision.md`, `docs/product/decisions.md`, `docs/product/open-questions.md`).
- Architecture and technical specifications (`docs/architecture/overview.md`, `docs/architecture/data-model.md`, `docs/architecture/api.md`, `docs/architecture/ads-pipelines.md`, `docs/architecture/adr/0001-stack.md`).
- Governance and policy specifications (`docs/taxonomy.md`, `docs/privacy.md`, `docs/content-moderation.md`, `docs/sources.md`, `docs/ad-policy.md`).
- Phase implementation checklists (`docs/phases/phase-0.md` through `docs/phases/phase-7.md`) and operations runbook index (`docs/runbooks/README.md`).
- Canonical 3-level taxonomy dataset (`data/taxonomy.json`) with 10 categories, 34 subcategories, and exact level-3 topics.
