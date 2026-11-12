# Changelog

All notable changes to Rada are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
