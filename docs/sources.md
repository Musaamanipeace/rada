# Automated Import Sources Registry

*Source: Section 11 (Phase 5) and Section 16 of the Rada Build Plan.*

## 1. Governance Rules for Automated Connectors (`Phase 5`)

Per `.agents/skills/import-content/SKILL.md` and `AGENTS.md`:

1. **Licence Verification Gate:** **No automated connector may be built or enabled until its source's terms of service / licence terms have been checked and recorded in this file.**
2. **ADR for Outbound Requests (`Rule 6`):** Every new external source connector introduces an outbound server-side network request and must be accompanied by an ADR in `docs/architecture/adr/`.
3. **Kill Switch Requirement:** Every connector must obey both the global kill switch (`FEATURE_AUTOMATED_IMPORTS_ENABLED`) and a per-connector kill switch so imports from any source can be halted immediately without a redeploy.
4. **Strict Taxonomy Mapping (`Rule 5`):** Each connector must include a deterministic mapping step that assigns a valid `(category_id, subcategory_id, topic_id)` tuple from `data/taxonomy.json`. Any item that fails mapping is **rejected immediately**, never inserted as uncategorised.
5. **Deduplication & Auto-Expiration:**
   - Deduplicate incoming items by canonical `url` and normalized `title`.
   - Automatically mark past-dated items (`ends_at < now`, or `starts_at < now` when `ends_at` is null) as `expired`.
   - Imported items load with `origin = 'import'` and `status = 'pending'` unless explicitly configured otherwise by Owner decision.

---

## 2. Approved Sources Table

*Populated during Phase 5 before building each connector.*

| Source ID | Name & URL | Content Categories | Feed / API Format | Licence / Terms Summary | Attribution Required? | Approved By | Kill Switch Env Var | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| *None yet (Phase 5)* | — | — | — | — | — | — | — | `TBD` |
