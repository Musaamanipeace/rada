# AGENTS.md — Rada Agent Rules & Operating Manual

*Source: Rada Build Plan, Agent Rules and Skills (Draft v3 · 11 November 2026).*
*Status definitions: `LOCKED` = decided by the owner. `PROPOSED` = suggested, awaiting confirmation. `TBD` = do not build.*

## How to Use This Repository

- **Read `AGENTS.md` first**, then read **only the current phase** in `docs/phases/phase-N.md`.
- **Never start a phase** before the previous phase's exit criteria are met.
- If the specification is ambiguous, log it in `docs/product/open-questions.md`, open a `needs-decision` issue, and work on something else.
- **Never guess, and never build `TBD` items.**

---

## Agent Rules (Mandatory)

1. **Source of truth, in order:**
   1. `docs/product/decisions.md`
   2. `Rada Build Plan, Agent Rules and Skills.md` (and `docs/`)
   3. Code comments
   *On conflict, stop and ask.*
2. **Work one phase at a time.** Read `docs/phases/phase-N.md` first and keep its checklist current.
3. **Never build, stub or mock `TBD` items.** Phase 6 starts only after the open items it depends on (`docs/product/open-questions.md`) are answered.
4. **Never guess.** Log ambiguity in `docs/product/open-questions.md`, open a `needs-decision` issue, and continue with unrelated tasks.
5. **Strict Taxonomy Enforcement:** Every item must have a `category`, `subcategory` and `topic`, enforced in the database and in validation. Never add a path that shows uncategorised content.
6. **Privacy is a hard limit:** No third-party analytics, pixels or fingerprinting, and no reading browser history or cache. Any new outbound request needs an ADR.
7. **Change Declaration:** New dependencies, services and schema changes must be named in the PR; major ones need an ADR in `docs/architecture/adr/`.
8. **PR & Git Discipline:** Small PRs (about 400 changed lines at most), conventional commits, branches named `phase-N/<topic>`. Open a PR; never push to `main`.
9. **Testing Requirement:** Every change ships with tests: unit (Vitest) for logic, Playwright for flows, axe for pages. CI must pass before review.
10. **Documentation Sync:** Update docs in the same PR (`docs/architecture/api.md`, `docs/architecture/data-model.md`, `docs/taxonomy.md`, the phase checklist in `docs/phases/phase-N.md`, `CHANGELOG.md`).
11. **Database Migrations:** Migrations are append-only. Never edit an applied migration. No destructive commands without explicit owner approval.
12. **Secrets Management:** Secrets live in environment variables only. Keep `.env.example` current.
13. **Accessibility & Performance Budgets:** Accessibility (WCAG 2.2 AA) and performance budgets in `docs/architecture/overview.md` (Section 10 of the build plan) are requirements, not polish.
14. **Boundary Validation & Rate Limiting:** Validate all input with Zod at every boundary and rate limit public endpoints.
15. **Skill Execution:** When a task matches a skill in `.agents/skills/`, use it and follow it exactly.
16. **Task Reporting:** End every task with a report:
    - What changed
    - What was tested
    - What remains
    - Open questions
17. **Ad Placement & Playback Isolation:** Ads appear **only** in the Watch Ads tab, and **only** after the viewer taps play. Never put ads in the feed, My Catalogues, the calendar or portfolios, and never build pop-ups, interstitials, forced watching or autoplay with sound. The feed API (`/api/feed`) and catalogues API (`/api/catalogues`) must never return ads; a test enforces it.
18. **No Viewer Compensation:** Viewers are never compensated for watching ads: no points, credits, rewards or perks tied to views.
19. **Monetary & Billing Integrity:**
    - Integer cents only.
    - The ledger (`ledger_entries`) is append-only and every entry has a unique reference (`ref`).
    - Event handling is idempotent.
    - Never store card data (if a payment provider is added later, use its hosted checkout).
    - Billing changes need owner review and a reconciliation test.
20. **First-Party Ad Events & Privacy:** Ad events are first-party only. Never add third-party SDKs, pixels or ad-network scripts to the app, never allow them in ad creative, and show advertisers aggregates only (hidden below minimum audience threshold of 20 qualified views).
21. **Watch Ads Feature Switch:** Watch Ads sits behind a switch that is **off by default** (`D23`). With it off, no ad code or media loads anywhere in the app and the Watch Ads endpoints return `404`.

---

## Available Agent Skills (`.agents/skills/<name>/SKILL.md`)

| Skill | Use when | Core steps |
| :--- | :--- | :--- |
| `start-phase` | Starting or continuing a phase | Read phase doc, verify previous exit criteria, list TBD exclusions, create branch and checklist, report plan |
| `add-migration` | Any schema change | Edit schema, generate migration, update `data-model.md`, add a constraint test |
| `add-api-endpoint` | New endpoint | Write contract in `api.md`, Zod schema, handler, tests, standard error shape |
| `change-taxonomy` | Any category change | Edit `taxonomy.json`, run validator, add migration, update `taxonomy.md` and `CHANGELOG.md`; never rename a slug without a migration |
| `import-content` | CSV or connector import | Validate, map to taxonomy, dedupe, load as pending; reject anything unmapped |
| `write-adr` | A costly-to-reverse decision | Context, options, decision, consequences; number it and link it in `decisions.md` |
| `update-docs` | End of any change | Check which docs the diff touches and update them |
| `review-pr` | Reviewing a PR | Spec match, privacy rules, ads only in Watch Ads, accessibility, tests, docs, no TBD built |
| `add-ad-format` | A new ad creative type | Define schema and limits in `ad-policy.md`, validation, upload and media checks, Watch Ads renderer, review checklist item, tests; no autoplay with sound |
| `billing-change` | Anything touching spend, the ledger or payments | Integer cents, append-only ledger entry with a unique ref, idempotency test, reconciliation test, owner review |
| `release` | Cutting a version | Changelog, version bump, full checks, tag |
