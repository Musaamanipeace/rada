---
name: import-content
description: Use when importing seed items from CSV or building/running automated content import connectors in Phase 1 or Phase 5.
---

# Import Content (`import-content`)

Follow these steps whenever importing content from CSV files (`data/seed/*.csv`) or automated connectors (Phase 5):

1. **Verify source licence (for automated connectors):** Before building or running any automated connector, confirm the source's licence terms are recorded and approved in `docs/sources.md`, and ensure the connector respects the global and per-connector kill switch.
2. **Validate input schema:** Parse every incoming row/record with Zod:
   - Required fields: `title`, `url` (valid HTTP/HTTPS URL), `category`, `subcategory`, `topic`.
   - Optional fields: `source_name`, `description` (max 280 chars), `thumbnail_url`, `cost` (`free` | `paid` | `unknown`), `starts_at`, `ends_at`, `timezone`, `region`.
3. **Map strictly to `data/taxonomy.json`:**
   - Resolve `category`, `subcategory`, and `topic` against `data/taxonomy.json` and confirm the three levels belong to the same parent chain.
   - **Reject any uncategorised or partially categorised item immediately.** Never create a fallback "uncategorised" bucket and never guess missing taxonomy fields.
4. **Deduplicate:**
   - Check existing items by canonicalized `url` and normalized `title`.
   - For survey suggestions or duplicate imports, increment `popularity_count` or mark status as `duplicate` per phase rules rather than inserting duplicate live items.
5. **Expire past-dated items:** Automatically reject or mark as `expired` any dated event/item whose `ends_at` (or `starts_at` if no `ends_at`) is in the past.
6. **Load status:** Load imported/surveyed items with `status = 'pending'` (unless running an explicitly reviewed owner seed script with `reviewed_by` recorded) and record `origin` (`seed`, `survey`, or `import`).
7. **Test with fixtures:** Every CSV importer or connector must include deterministic test fixtures covering valid rows, missing category/subcategory/topic rejection, duplicate detection, and past-date expiration.
