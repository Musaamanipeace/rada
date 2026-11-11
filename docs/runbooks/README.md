# Operations & Incident Runbooks

*Source: Section 11 (Phase 7) and Section 12 of the Rada Build Plan.*

## Runbooks Index

Detailed operational runbooks are completed and drilled during **Phase 7 (Launch Hardening)** and as operational subsystems come online:

1. **Local Development & Fresh Clone Setup (`Phase 0`):**
   - Documented in [`README.md`](../../README.md). Target: fresh clone to running app in under 10 minutes.
2. **Database Backup & Restore Drill (`Phase 7`):**
   - Automated daily PostgreSQL snapshots, point-in-time recovery verification, and append-only migration rollback/fix-forward procedures.
3. **Automated Import Kill Switch (`Phase 5`):**
   - How to disable `FEATURE_AUTOMATED_IMPORTS_ENABLED` or individual source connectors immediately if an external feed changes format or licence terms.
4. **Watch Ads Master Switch & Ad Emergency Pause (`Phase 6`):**
   - How to toggle the Watch Ads master switch (`D23`) via `PATCH /api/admin/config` or environment config, and how to pause a reported ad or suspend an advertiser account.
5. **Nightly Billing & Ledger Reconciliation (`Phase 6c`):**
   - How to inspect nightly reconciliation alerts comparing `ad_stats_daily`, `advertisers.free_views_used`, and `ledger_entries`, and how to record an audited `adjustment` or `refund` entry in `ledger_entries`.
