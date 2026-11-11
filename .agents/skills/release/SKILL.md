---
name: release
description: Use when cutting a versioned release or completing a major phase milestone. Runs full quality, accessibility, privacy, and documentation checks before tagging.
---

# Cut a Release (`release`)

Follow these steps when cutting a release of Rada:

1. **Verify phase exit criteria:** Confirm all checklist items and exit criteria for the target phase(s) in `docs/phases/phase-N.md` are complete and verified.
2. **Verify no `TBD` leakage:** Check that no unresolved items from `docs/product/open-questions.md` were inadvertently included or enabled.
3. **Verify Watch Ads switch (`D23`):** Unless the first advertiser has been approved and Phase 6 exit criteria are met, confirm the Watch Ads switch defaults to `false` and Watch Ads endpoints return `404`.
4. **Run full verification suite:**
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test` (unit, constraint, and taxonomy tests)
   - `pnpm build` (including bundle size / JS budget check)
   - `pnpm test:e2e` (Playwright end-to-end flows, axe accessibility checks, zero-image-request check with thumbnails hidden, and zero undeclared third-party network request check)
5. **Update `CHANGELOG.md` and version:**
   - Move items from `[Unreleased]` to a dated version heading (`## [x.y.z] - YYYY-MM-DD`).
   - Bump `version` in `package.json`.
6. **Open release PR & tag:**
   - Submit the release PR for Owner approval.
   - After merge to `main`, create an annotated git tag `vx.y.z`.
