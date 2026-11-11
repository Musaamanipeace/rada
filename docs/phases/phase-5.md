# Phase 5: Automated Imports

*Source: Section 11 (Phase 5) of the Rada Build Plan.*
*Skills to run: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md) and [`.agents/skills/import-content/SKILL.md`](../../.agents/skills/import-content/SKILL.md).*

## Prerequisites

- **All Phase 4 exit criteria in [`docs/phases/phase-4.md`](./phase-4.md) must be ticked.**
- **Every external source's licence terms must be checked and recorded in [`docs/sources.md`](../sources.md) (with an ADR for its outbound requests) before building its connector.**

---

## Scope & Task Checklist

- [ ] **Import Pipeline Framework & Kill Switches:**
  - [ ] Global kill switch (`FEATURE_AUTOMATED_IMPORTS_ENABLED`) and per-connector kill switches.
  - [ ] Strict taxonomy mapping step (`category_id`, `subcategory_id`, `topic_id`); reject any unmapped or partially mapped item immediately.
  - [ ] Deduplication by canonicalized `url` and normalized `title` (incrementing `popularity_count` or marking `duplicate`).
  - [ ] Automatic expiration job that transitions past-dated items (`ends_at < now`, or `starts_at < now` when `ends_at` is null) to `status = 'expired'`, and triggers date-change notices for linked `calendar_events` (`D12`).
- [ ] **Dated Content Connectors (Per Approved Source in `docs/sources.md`):**
  - [ ] Releases connector(s).
  - [ ] Online & in-person events connector(s).
  - [ ] Hackathons & competitions connector(s).
  - [ ] Scholarships & grants connector(s).
  - [ ] Curated RSS/Atom connector(s).

---

## Exit Criteria (Must All Pass Before Concluding Phase 5)

- [ ] Deterministic test fixtures and unit/integration tests pass for every connector (including rejection of uncategorised items, deduplication, and past-date expiration).
- [ ] Global and per-connector kill switches are tested and verified.
- [ ] Zero connectors exist without verified and documented licence terms in [`docs/sources.md`](../sources.md).
