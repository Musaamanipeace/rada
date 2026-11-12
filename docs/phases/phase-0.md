# Phase 0: Foundations

*Source: Section 11 of the Rada Build Plan.*
*Skill to run before coding: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md).*

## Prerequisites

- None (Initial phase).

---

## Scope & Task Checklist

- [x] **Documentation & Governance Skeleton (`Section 12–15`):**
  - [x] `AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `CHANGELOG.md`, `.env.example`, `.gitignore`.
  - [x] Agent skills in `.agents/skills/<skill>/SKILL.md` (11 skills).
  - [x] Product docs (`docs/product/vision.md`, `docs/product/decisions.md`, `docs/product/open-questions.md`).
  - [x] Architecture & policy docs (`docs/architecture/*`, `docs/taxonomy.md`, `docs/privacy.md`, `docs/content-moderation.md`, `docs/sources.md`, `docs/ad-policy.md`).
  - [x] Canonical `data/taxonomy.json` (10 categories, 34 subcategories, exact level-3 topics).
  - [x] Draft [ADR-0001: Modular Monolith Technology Stack](../architecture/adr/0001-stack.md).
- [x] **Repository Tooling & CI:**
  - [x] Initialize `pnpm` project, Next.js (App Router), TypeScript (`strict: true`), Tailwind CSS, ESLint, and Prettier.
  - [x] Configure Vitest (unit/integration) and Playwright + `@axe-core/playwright` (e2e + accessibility).
  - [x] Define client JS bundle budget and enforce in CI alongside markdown link checking (`lint`, `typecheck`, `test`, `build`).
- [x] **Database, Migrations & Taxonomy Seed:**
  - [x] Configure PostgreSQL + Prisma (`prisma/schema.prisma`) with core tables (`users`, `anon_sessions`, `categories`, `subcategories`, `topics`, `items` with composite taxonomy FK constraints, `user_interests`, `interactions`, `saved_items`, `calendar_events`, `survey_sessions`, `survey_suggestions`, `portfolios`, `audit_log`). *(Do not create Phase 6 ad tables yet.)*
  - [x] Write taxonomy seed script (`pnpm db:seed`) loading from `data/taxonomy.json`.
  - [x] Write automated taxonomy validation test (`pnpm test:taxonomy`) confirming 10 categories, 34 subcategories, and composite parent-child constraints.
- [x] **Authentication & Guest Sessions:**
  - [x] Configure Auth.js (email magic link) and first-party guest anonymous session tokens (`anon_sessions`).
- [x] **App Shell, Design Tokens & PWA Manifest:**
  - [x] Build responsive App Shell (360 px to 1440 px) with navigation (Feed, My Catalogues, Calendar, Portfolio; Watch Ads hidden while switch is off per `D23`).
  - [x] Configure light and dark theme tokens and externalised i18n string dictionary (`en`).
  - [x] Configure Serwist service worker and installable PWA manifest.

---

## TBD Exclusions (Do Not Build in Phase 0)

- Phase 6 Ad tables (`advertisers`, `campaigns`, `ads`, `ledger_entries`, etc.).
- AI provider implementation (only the empty `src/lib/ai` interface if needed).
- Any unconfirmed items in [`docs/product/open-questions.md`](../product/open-questions.md).

---

## Exit Criteria (Must All Pass Before Starting Phase 1)

- [x] CI pipeline is green (`lint`, `typecheck`, `test`, `build`, markdown link check).
- [x] A fresh clone runs from `README.md` instructions in under 10 minutes.
- [x] Automated taxonomy validation test confirms exactly **10 categories** and **34 subcategories** seeded from `data/taxonomy.json`.
- [x] Stack in [ADR-0001](../architecture/adr/0001-stack.md) is confirmed or updated.
