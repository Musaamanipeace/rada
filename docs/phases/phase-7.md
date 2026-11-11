# Phase 7: Launch Hardening

*Source: Section 11 (Phase 7) of the Rada Build Plan.*
*Skills to run: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md) and [`.agents/skills/release/SKILL.md`](../../.agents/skills/release/SKILL.md).*

## Prerequisites

- **All exit criteria for Phases 0–5 (and any enabled Phase 6 slices) must be ticked.**
- **Subcategory seed library target met:** At least 10 approved items per subcategory across all 34 subcategories (340+ items).

---

## Scope & Task Checklist

- [ ] **Security Review:**
  - [ ] Verify Zod validation at every boundary, rate limiting on all public endpoints, CSRF protection, `rel="noopener noreferrer"` on external links, and role checks (`reviewer`, `admin`, `advertiser`) on every protected route.
  - [ ] Dependency vulnerability audit (`pnpm audit`).
- [ ] **Performance & Load Testing:**
  - [ ] Load test `/api/feed`, `/api/catalogues`, `/api/survey/*`, and public portfolios (`/<username>`).
  - [ ] Verify `LCP < 2.5 s` over simulated 4G on a mid-range phone and `≥ 55 fps` scrolling 2,000 items.
- [ ] **Database Backup & Restore Drill:**
  - [ ] Execute a full backup and point-in-time restore drill on a staging database and document the procedure in [`docs/runbooks/README.md`](../runbooks/README.md).
- [ ] **Privacy Audit (`docs/privacy.md`):**
  - [ ] Verify zero third-party analytics, pixels, fingerprinting, or undeclared outbound requests across all routes.
  - [ ] Verify `GET /api/me/data` (export) and `DELETE /api/me/data` (account & signal deletion) completeness.
  - [ ] Confirm Watch Ads switch (`D23`) is off unless the first advertiser is approved and all Phase 6 prerequisites are met.
- [ ] **Accessibility Audit:**
  - [ ] Full WCAG 2.2 AA audit across all screens (keyboard-only navigation, screen-reader labels, focus management, colour contrast, `prefers-reduced-motion`, captions and alt text).
- [ ] **Runbooks, Release Checklist & v1.0 Changelog:**
  - [ ] Complete operational runbooks in `docs/runbooks/`.
  - [ ] Cut `v1.0.0` in [`CHANGELOG.md`](../../CHANGELOG.md) using the `release` skill.

---

## Exit Criteria (v1.0 Launch Gate)

- [ ] Security, privacy, accessibility, and performance audits pass with zero open critical or high issues.
- [ ] Database backup and restore drill completed and timed.
- [ ] All CI checks green and `v1.0.0` tagged on `main`.
