# Phase 4: Portfolio MVP

*Source: Section 11 (Phase 4) and Section 8.6 of the Rada Build Plan.*
*Skill to run before coding: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md).*

## Prerequisites

- **All Phase 3 exit criteria in [`docs/phases/phase-3.md`](./phase-3.md) must be ticked.**

---

## Scope & Task Checklist

- [ ] **Portfolio API & Data Layer (`8.6`):**
  - [ ] `GET | POST | PATCH | DELETE /api/portfolio` and `POST /api/portfolio/publish`.
  - [ ] Support profile (`username`, `headline`, `intro`, `avatar`), 1–3 projects (`portfolio_projects`), ordered links (`portfolio_links`), and section/item `hidden` flags.
- [ ] **Portfolio Builder & Editor UI (`8.6`):**
  - [ ] Quick-start onboarding flow and completion checklist.
  - [ ] Choice of 3 templates and theme selection.
  - [ ] Live desktop and mobile preview.
  - [ ] Editor autosave.
  - [ ] Publish and unpublish controls with visibility modes: `draft`, `public`, and `unlisted`.
- [ ] **Public Portfolio Page (`/<username>`):**
  - [ ] Render public and unlisted portfolios at `<domain>/<username>`.
  - [ ] Enforce `404` for any portfolio in `draft` visibility.
  - [ ] Emit indexable SEO metadata only when `visibility === 'public'` (`Section 10`).
- [ ] **Opt-In AI Copy Assistant (`src/lib/ai`):**
  - [ ] Implement provider-agnostic interface in `src/lib/ai` to suggest headlines and project descriptions only; require explicit user approval before applying any suggestion. *(If `O10` AI provider remains `TBD`, keep provider adapter disabled/configurable without blocking manual portfolio creation.)*

---

## TBD / Post-MVP Exclusions (Do Not Build in Phase 4)

- Extra custom sections beyond profile, 1–3 projects, and links.
- Testimonials, custom domains, and portfolio analytics.

---

## Exit Criteria (Must All Pass Before Starting Phase 5 or Phase 6)

- [ ] E2E flow confirms a new user can create and publish a portfolio with 1–3 projects in under 10 minutes.
- [ ] Automated test proves `draft` portfolios are unreachable publicly (`404`).
- [ ] Published portfolio pages score **≥ 90** in Lighthouse (Performance, Accessibility, Best Practices, SEO) and pass axe checks.
