# Changelog

All notable changes to Rada are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
