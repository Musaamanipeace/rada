# Phase 2: Feed and Onboarding

*Source: Section 11 (Phase 2), Section 8.1, Section 8.2, and Section 9 of the Rada Build Plan.*
*Skill to run before coding: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md).*

## Prerequisites

- **All Phase 1 exit criteria in [`docs/phases/phase-1.md`](./phase-1.md) must be ticked.**

---

## Scope & Task Checklist

- [x] **Onboarding Interest Selection (`8.1`, `D8`):**
  - [x] Onboarding screen prompting new users/guests to select at least 3 subcategory interests (`user_interests`) — `src/features/onboarding/OnboardingModal.tsx`.
  - [x] Skippable onboarding (skipping defaults the feed to Variety mode) — Skip button in `OnboardingModal`.
- [x] **Ranking v1 (`Section 9`):**
  - [x] Implement canonical weights in `src/lib/ranking/weights.ts` (topic `1.0`, subcategory `0.7`, category `0.4`; 30-day decaying interactions: `save`/`calendar_add` `+3`, `open` `+1`, `dismiss` `-3`; popularity boost; upcoming dated freshness boost).
  - [x] Reserve ~15% of each 20-item batch for exploration outside the user's stated interests.
  - [x] Enforce exclusions: never repeat within a session, never return `dismiss`ed items, never return already-saved items (`saved_items`), and automatically drop past-dated items.
- [x] **Feed API & Interactions (`GET /api/feed`, `POST /api/items/:id/dismiss`, `POST /api/interactions`):**
  - [x] Cursor pagination (20 items per batch).
  - [x] Multi-select category filters, subcategory/topic filters (including `General / All topics` items matching within their subcategory per `D30`), **Variety** mode (`D3`), and toggles for **Free/Paid**, **Upcoming**, and **Local** (`D13`).
  - [x] Exhaustion recycling: when fresh items run out, shuffle and recycle unsaved, non-dismissed items so the user never hits a dead end.
  - [x] Test enforcing `/api/feed` never returns ads (`Rule 17`) — `tests/unit/ranking-engine.test.ts` + `tests/e2e/feed.spec.ts`.
- [x] **Virtualized Feed UI & States (`8.1`):**
  - [x] Header with scrollable category chips, Variety chip, Free/Paid, Upcoming, and Local toggles, and Hide thumbnails toggle — `src/features/feed/FeedHeader.tsx`.
  - [x] Unified discovery stream: seamlessly blends articles, podcasts, courses, videos, books, games, and local activities into one distraction-free infinite virtual list without requiring siloed tabs — `src/features/feed/DiscoveryFeed.tsx`.
  - [x] Item card with thumbnail (hideable), title, source, category tag, cost badge (`Free` combining freemium/free tier per `D28`, or `Paid`), date (if dated), and actions: Save, Open (new tab, `rel="noopener noreferrer"`), Not interested, and Add to calendar (on dated items only) — `src/features/feed/FeedItemCard.tsx`.
  - [x] Entertainment & movie handling: movie/series cards display release year, director/creator metadata, and link to canonical reference/streaming destination; future-dated releases (`starts_at > now`) trigger the **Upcoming** toggle and offer **Add to calendar** (`D5`, `O18`).
  - [x] Endless scroll using `@tanstack/react-virtual`, skeleton loading cards, and Clear filters button on empty filter matches — `src/features/feed/FeedSkeleton.tsx`.
- [x] **Hide Thumbnails Toggle (`8.2`, `D6`):**
  - [x] Toggle in feed header and settings (`thumbnails_hidden` synced to account for logged-in users via `GET/PATCH /api/me/settings`, persisted locally for guests via `ui-store`; default off).
  - [x] Compact text + category-icon card layout when on, making **zero network image requests**.

---

## Exit Criteria (Must All Pass Before Starting Phase 3)

- [x] Performance budgets met (`LCP < 2.5 s` on mid-range phone over 4G; `≥ 55 fps` scrolling 2,000 items; JS bundle budget met — First Load JS 113 kB, `@tanstack/react-virtual` virtualization).
- [x] Filter, Variety mode, and onboarding Playwright e2e + axe tests written (`tests/e2e/feed.spec.ts`, `tests/e2e/onboarding.spec.ts`). Must pass on CI.
- [x] With `thumbnails_hidden` enabled, a Playwright network-interception test proves **zero image requests** are made (`tests/e2e/feed.spec.ts` — "zero image network requests" test).
- [x] An automated Playwright test fails the build on any undeclared third-party network request (`tests/e2e/feed.spec.ts` — "no undeclared third-party network requests" test).
