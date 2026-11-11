---
name: billing-change
description: Use whenever writing or modifying code that touches ad spend, free view allowances, rate cards, the ledger, manual credit top-ups, or payment webhooks.
---

# Billing & Ledger Change (`billing-change`)

`src/lib/ads/billing/` is protected by `CODEOWNERS` and governed by `AGENTS.md` Rule 19. Follow every step below whenever touching billing, spend, free view allowances, or the ledger:

1. **Integer cents only:** Represent all currency amounts (`budget_cents`, `daily_cap_cents`, `price_per_qualified_view_cents`, `min_topup_cents`, `spend_cents`, `amount_cents`) as signed or unsigned integers in cents. Never use floating-point numbers for money.
2. **Append-only ledger (`ledger_entries`):**
   - Never `UPDATE` or `DELETE` rows in `ledger_entries`.
   - Every entry (`topup`, `spend`, `refund`, `adjustment`) must have a globally unique `ref` (payment reference, manual credit note ID, or deterministic aggregation job key).
   - An advertiser's current balance is always the exact sum of `amount_cents` in `ledger_entries`.
3. **Free allowance precedence (`D19`):**
   - Apply qualified views against the advertiser's remaining free allowance first (`free_views_used < free_views_granted`), recording `free_qualified_views` in `ad_stats_daily` with `spend_cents = 0`.
   - Only after the free allowance is exhausted, charge qualified views at the campaign's active `rate_card` and write a `spend` entry to `ledger_entries`.
4. **Automatic pausing:**
   - Immediately pause a live campaign and notify the advertiser when its free allowance and prepaid balance are exhausted, or when it reaches its campaign `budget_cents` or `daily_cap_cents`.
5. **No card storage (`D24` & Rule 19):**
   - At launch, credits are added manually by the Owner via `POST /api/admin/advertisers/:id/credit` with a required reference note.
   - If a payment provider is added later, use hosted checkout only so card numbers never touch Rada servers, and verify webhook signatures idempotently.
6. **Mandatory tests:**
   - **Idempotency test:** Replaying the exact same `ad_events` batch or aggregation job run produces zero duplicate `ad_events`, zero extra `free_views_used`, and zero duplicate `ledger_entries`.
   - **Reconciliation test:** Verify that `ad_stats_daily` spend totals and free-view counts match `ledger_entries` and `advertisers.free_views_used` with zero discrepancy.
7. **Request Owner review:** Flag the PR for explicit Owner review per `CODEOWNERS`.
