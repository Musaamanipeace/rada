# Rada

Rada is a simple, cross-platform installable progressive web app (PWA) for discovering things to do online and offline.

It features:
- **Content Suggestion:** An endless, virtualized discovery feed across 10 categories, 34 subcategories, and curated topics, with **Variety mode**, **Hide thumbnails**, and **My Catalogues** for private saved items.
- **Calendar:** Month and agenda views for dated items and personal plans, with reminders, completion history, and `.ics` export.
- **Portfolio:** A clean, fast personal portfolio builder (`<domain>/<username>`) with templates and an opt-in AI copy assistant.
- **Watch Ads & Become an Advertiser:** A strictly opt-in, user-initiated destination for informative or entertaining ads (off at launch until the first advertiser is approved; zero ads in the feed or anywhere else in the app).

---

## Documentation Map

- **Master Plan:** [`Rada Build Plan, Agent Rules and Skills.md`](./Rada%20Build%20Plan,%20Agent%20Rules%20and%20Skills.md)
- **Agent Rules & Skills:** [`AGENTS.md`](./AGENTS.md) · [`.agents/skills/`](./.agents/skills/)
- **Contributing Guide:** [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- **Product Specs:**
  - [Product Vision & Glossary](./docs/product/vision.md)
  - [Decisions Log (LOCKED & PROPOSED)](./docs/product/decisions.md)
  - [Open Questions (TBD — Do Not Build)](./docs/product/open-questions.md)
- **Architecture & Specifications:**
  - [Architecture Overview & NFRs](./docs/architecture/overview.md)
  - [Data Model](./docs/architecture/data-model.md)
  - [API Contract](./docs/architecture/api.md)
  - [Ad Pipelines & State Machines](./docs/architecture/ads-pipelines.md)
  - [ADR-0001: Technology Stack](./docs/architecture/adr/0001-stack.md)
- **Policies & Domain Rules:**
  - [Taxonomy Specification](./docs/taxonomy.md) ([`data/taxonomy.json`](./data/taxonomy.json))
  - [Privacy Rules & Hard Limits](./docs/privacy.md)
  - [Content Moderation Policy](./docs/content-moderation.md)
  - [Automated Import Sources](./docs/sources.md)
  - [Advertising Policy & Review Checklist](./docs/ad-policy.md)
- **Build Phases:**
  - [Phase 0: Foundations](./docs/phases/phase-0.md)
  - [Phase 1: Landing Page, Survey and Review Queue](./docs/phases/phase-1.md)
  - [Phase 2: Feed and Onboarding](./docs/phases/phase-2.md)
  - [Phase 3: My Catalogues and Calendar](./docs/phases/phase-3.md)
  - [Phase 4: Portfolio MVP](./docs/phases/phase-4.md)
  - [Phase 5: Automated Imports](./docs/phases/phase-5.md)
  - [Phase 6: Watch Ads and Advertiser (6a–6d)](./docs/phases/phase-6.md)
  - [Phase 7: Launch Hardening](./docs/phases/phase-7.md)

---

## Quick Start

> **Note:** Application tooling and database setup are implemented in [Phase 0: Foundations](./docs/phases/phase-0.md). Once Phase 0 is complete, a fresh clone will run in under 10 minutes using the steps below.

### Prerequisites

- **Node.js:** v20+ LTS
- **Package Manager:** `pnpm` (v9+)
- **Database:** PostgreSQL 15+

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your local PostgreSQL connection string and secrets

# 3. Run database migrations and seed taxonomy
pnpm db:migrate
pnpm db:seed

# 4. Start the development server
pnpm dev
```

---

## Running Tests & Quality Checks

```bash
# Lint & Typecheck
pnpm lint
pnpm typecheck

# Unit & Integration Tests (Vitest)
pnpm test

# Taxonomy Validation Test
pnpm test:taxonomy

# End-to-End & Accessibility Tests (Playwright + axe)
pnpm test:e2e

# Production Build Check
pnpm build
```

## License

TBD (see [`docs/product/open-questions.md`](./docs/product/open-questions.md)).
