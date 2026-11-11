---
name: change-taxonomy
description: Use whenever adding, updating, or reorganizing categories, subcategories, or level-3 topics in data/taxonomy.json.
---

# Change Taxonomy (`change-taxonomy`)

`data/taxonomy.json` is the canonical source of truth for Rada's 3-level taxonomy (Categories → Subcategories → Topics) and is protected by `CODEOWNERS` (requires owner approval).

Follow these steps strictly for any taxonomy change:

1. **Verify owner approval:** Confirm the change is approved in `docs/product/decisions.md` before modifying `data/taxonomy.json`.
2. **Edit `data/taxonomy.json`:**
   - Keep exact hierarchy: Level 1 (`categories`), Level 2 (`subcategories`), Level 3 (`topics`).
   - **Never rename or remove an existing slug without a data migration** that updates existing rows in `categories`, `subcategories`, `topics`, `items`, `user_interests`, `survey_suggestions`, and `ads`.
3. **Run the taxonomy validator:** Run `pnpm test:taxonomy` to verify structural integrity, slug uniqueness, sort ordering, and exact counts (10 categories and 34 subcategories at baseline).
4. **Add a database migration / seed update:** Ensure the database seed script and a migration reconcile existing records cleanly without orphaning items.
5. **Update documentation:** Update `docs/taxonomy.md` and `CHANGELOG.md` in the same PR so the markdown documentation matches `data/taxonomy.json` exactly.
