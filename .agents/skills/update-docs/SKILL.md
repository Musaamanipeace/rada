---
name: update-docs
description: Use at the end of any code, schema, API, taxonomy, or feature change before opening or updating a pull request.
---

# Update Documentation (`update-docs`)

Per `AGENTS.md` Rule 10, documentation must be updated in the **same PR** as the code change. Run through this checklist before concluding any task:

1. **Inspect the git diff** (`git status` / `git diff`) to see every touched module, schema, route, or configuration file.
2. **Update matching specifications:**
   - Database / Prisma changes → `docs/architecture/data-model.md`
   - API routes / payloads / error codes → `docs/architecture/api.md`
   - Taxonomy (`data/taxonomy.json`) → `docs/taxonomy.md`
   - Ad pipelines / state machine / billing → `docs/architecture/ads-pipelines.md` and `docs/ad-policy.md`
   - Import connectors → `docs/sources.md`
   - Environment variables → `.env.example`
   - Architectural / dependency choices → `docs/architecture/adr/` and `docs/product/decisions.md`
   - Ambiguities discovered → `docs/product/open-questions.md`
3. **Update the active phase checklist:** Tick completed items in `docs/phases/phase-N.md`.
4. **Update `CHANGELOG.md`:** Add a concise entry under `[Unreleased]`.
5. **Verify markdown links:** Ensure all relative links between markdown files resolve cleanly.
