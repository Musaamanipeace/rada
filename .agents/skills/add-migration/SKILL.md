---
name: add-migration
description: Use whenever making any database schema change. Enforces append-only migrations, documentation updates, and database constraint tests.
---

# Add Database Migration (`add-migration`)

Follow these steps strictly for every database schema change:

1. Check `AGENTS.md` Rule 11: Migrations are **append-only**. Never edit an already-applied migration, and never run destructive commands without explicit owner approval (`CODEOWNERS` applies to migrations).
2. Verify phase scope: Do not create Phase 6 ad tables (`advertisers`, `campaigns`, `ads`, `ledger_entries`, etc.) before Phase 6a.
3. Edit `prisma/schema.prisma` to reflect the required schema additions or changes:
   - For `items`, ensure `category_id`, `subcategory_id`, and `topic_id` are `NOT NULL` with composite foreign keys so the three hierarchy levels always agree.
   - For append-only tables (`interactions`, `ad_events`, `ledger_entries`), ensure no update/delete cascades violate append-only semantics.
   - For monetary columns (`budget_cents`, `daily_cap_cents`, `price_per_qualified_view_cents`, `min_topup_cents`, `spend_cents`, `amount_cents`), use integer cents only.
4. Generate a new migration (`pnpm prisma migrate dev --name <descriptive_name>`).
5. Update `docs/architecture/data-model.md` and `CHANGELOG.md` in the same PR.
6. Write and run a database constraint test (e.g., verifying foreign keys, composite taxonomy agreement, uniqueness, or `NOT NULL` enforcement).
