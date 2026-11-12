# ADR-0001: Modular Monolith Technology Stack

- **Status:** `ACCEPTED` (Confirmed during Phase 0; linked to Decision `D1` and `D14`)
- **Date:** 2026-11-11
- **Deciders:** Owner

---

## Context

Rada is a cross-platform installable PWA (`D1`) covering content discovery (virtualized feed, My Catalogues), Calendar, Portfolio builder, Pre-launch Survey, and an opt-in Watch Ads / Advertiser portal (`D7`, `D16`, `D23`).

We need a technology stack that:
1. Enables a single developer or small team (with autonomous coding agents) to spin up a fresh clone in under 10 minutes (`Phase 0` exit criterion).
2. Enforces strict type safety and boundary validation (`AGENTS.md` Rule 14).
3. Enforces relational integrity for the 3-level taxonomy (`D2`) and append-only financial/event ledgers (`D19`, Rule 19).
4. Meets strict performance (`LCP < 2.5s`, `≥ 55 fps` feed scroll, zero image requests when thumbnails are hidden) and accessibility (`WCAG 2.2 AA`) budgets (`Section 10`).
5. Introduces **zero third-party tracking, analytics, or telemetry scripts** (`Rule 6`).

---

## Options Considered

### Option 1: Modular Monolith with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL + Prisma (Proposed)
- **Pros:** Unified TypeScript codebase for UI and API route handlers; strong ecosystem for PWA service workers (Serwist), list virtualization (`@tanstack/react-virtual`), and E2E + accessibility testing (Playwright + axe); PostgreSQL composite foreign keys natively enforce the 3-level taxonomy invariant (`category_id`, `subcategory_id`, `topic_id`) and ACID transactions for the append-only billing ledger.
- **Cons:** Requires discipline to maintain feature module boundaries (`src/features/*` and `src/lib/*`) inside a single repository.

### Option 2: Separate SPA Frontend + Standalone Backend Service (e.g., Vite React + Fastify/Go API)
- **Pros:** Hard process separation between frontend and backend.
- **Cons:** Doubles build/deployment complexity, requires maintaining cross-repo or monorepo API codegen, and complicates SSR/SEO for the public landing page and public user portfolios (`/<username>`).

### Option 3: Serverless NoSQL / BaaS (e.g., Firebase / DynamoDB)
- **Pros:** Fast initial prototyping.
- **Cons:** Lacks relational composite foreign keys for strict 3-level taxonomy enforcement (`D2`), complicates append-only integer-cent ledger reconciliation (`Rule 19`), and often bundles third-party client SDKs that conflict with Rada's strict first-party privacy rules (`Rule 6`).

---

## Decision

We adopt **Option 1: One Modular Monolith organised by feature**, using the following stack (`Section 5`):

- **Runtime & Framework:** Next.js (App Router), TypeScript (`strict` mode), Tailwind CSS.
- **Database & Migrations:** PostgreSQL with Prisma ORM (`prisma/migrations/` committed to the repo; append-only migrations).
- **Boundary Validation:** Zod at every API, import, and environment boundary.
- **Authentication:** Auth.js with email magic link (`O9` default); guests receive a first-party token stored in `anon_sessions` and claimed on signup.
- **Client State & Virtualization:** TanStack Query for server state; persisted Zustand store for UI preferences (filters, `thumbnails_hidden`); `@tanstack/react-virtual` for the endless feed.
- **PWA & Offline:** Serwist for the service worker and web app manifest (offline read-only support for My Catalogues and Calendar).
- **AI Interface:** Provider-agnostic interface in `src/lib/ai` for the Phase 4 Portfolio copy assistant.
- **Tooling & Testing:** `pnpm`, ESLint, Prettier, Vitest (unit/integration), Playwright + `@axe-core/playwright` (e2e + WCAG 2.2 AA accessibility), GitHub Actions CI.

---

## Privacy & Security Impact

- **Zero third-party telemetry:** Next.js telemetry will be disabled in development and CI (`NEXT_TELEMETRY_DISABLED=1`).
- **First-party sessions only:** Auth.js and guest tokens use first-party storage only.
- **No external fonts or CDNs by default:** Fonts and icons are self-hosted in the bundle so the app makes zero undeclared third-party network requests (enforced by a Phase 2 Playwright test).

---

## Consequences

- **Positive:** Single command (`pnpm dev`) starts the full stack locally; shared Zod schemas guarantee API contract fidelity; PostgreSQL enforces taxonomy and ledger invariants at the database layer.
- **Negative / Mitigations:** Module boundaries (`src/features/*`, `src/lib/*`) must be enforced via code review (`review-pr` skill) and lint rules so features do not bypass public module interfaces.
