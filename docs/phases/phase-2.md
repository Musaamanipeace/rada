# Phase 2: Feed and Onboarding

*Source: Section 11 (Phase 2), Section 8.1, Section 8.2, and Section 9 of the Rada Build Plan.*
*Skill to run before coding: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md).*

## Prerequisites

- **All Phase 1 exit criteria in [`docs/phases/phase-1.md`](./phase-1.md) must be ticked.**

---

## Scope & Task Checklist

- [ ] **Onboarding Interest Selection (`8.1`, `D8`):**
  - [ ] Onboarding screen prompting new users/guests to select at least 3 subcategory interests (`user_interests`).
  - [ ] Skippable onboarding (skipping defaults the feed to Variety mode).
- [ ] **Ranking v1 (`Section 9`):**
  - [ ] Implement canonical weights in `src/lib/ranking/weights.ts` (topic `1.0`, subcategory `0.7`, category `0.4`; 30-day decaying interactions: `save`/`calendar_add` `+3`, `open` `+1`, `dismiss` `-3`; popularity boost; upcoming dated freshness boost).
  - [ ] Reserve ~15% of each 20-item batch for exploration outside the user's stated interests.
  - [ ] Enforce exclusions: never repeat within a session, never return `dismiss`ed items, never return already-saved items (`saved_items`), and automatically drop past-dated items.
- [ ] **Feed API & Interactions (`GET /api/feed`, `POST /api/items/:id/dismiss`, `POST /api/interactions`):**
  - [ ] Cursor pagination (20 items per batch).
  - [ ] Multi-select category filters, subcategory/topic filters, **Variety** mode (`D3`), and toggles for **Free/Paid**, **Upcoming**, and **Local** (`D13`).
  - [ ] Exhaustion recycling: when fresh items run out, shuffle and recycle unsaved, non-dismissed items so the user never hits a dead end.
  - [ ] Test enforcing `/api/feed` never returns ads (`Rule 17`).
- [ ] **Virtualized Feed UI & States (`8.1`):**
  - [ ] Header with scrollable category chips, Variety chip, Free/Paid, Upcoming, and Local toggles, and Hide thumbnails toggle.
  - [ ] Item card with thumbnail (hideable), title, source, category tag, cost badge, date (if dated), and actions: Save, Open (new tab, `rel="noopener noreferrer"`), Not interested, and Add to calendar (on dated items only).
  - [ ] Endless scroll using `@tanstack/react-virtual`, skeleton loading cards, and Clear filters button on empty filter matches.
- [ ] **Hide Thumbnails Toggle (`8.2`, `D6`):**
  - [ ] Toggle in feed header and settings (`thumbnails_hidden` synced to account for logged-in users, persisted locally for guests; default off).
  - [ ] Compact text + category-icon card layout when on, making **zero network image requests**.

---

## Exit Criteria (Must All Pass Before Starting Phase 3)

- [ ] Performance budgets met (`LCP < 2.5 s` on mid-range phone over 4G; `≥ 55 fps` scrolling 2,000 items; JS bundle budget met).
- [ ] Filter, Variety mode, and onboarding Playwright e2e + axe tests pass.
- [ ] With `thumbnails_hidden` enabled, a Playwright network-interception test proves **zero image requests** are made.
- [ ] An automated Playwright test fails the build on any undeclared third-party network request (`Rule 6`).
