---
name: write-adr
description: Use when making any architectural decision that costs more than a day to reverse, adding a major dependency or service, or introducing any new outbound network request.
---

# Write Architecture Decision Record (`write-adr`)

Follow these steps whenever an ADR is required (Rule 6, Rule 7, Section 12):

1. **Determine the next ADR number:** Check `docs/architecture/adr/` and assign the next sequential 4-digit number (e.g., `docs/architecture/adr/0002-video-transcoding-provider.md`).
2. **Draft the ADR using the standard template:**
   - **Title:** `ADR-NNNN: <Short Decision Title>`
   - **Status:** `PROPOSED` | `ACCEPTED` | `SUPERSEDED`
   - **Date:** `YYYY-MM-DD`
   - **Context:** What problem or constraint requires a decision? Which phase and requirement does this affect?
   - **Privacy & Security Impact:** Does this introduce any outbound requests, third-party code, or data storage? (Must comply with `docs/privacy.md` hard limits.)
   - **Options Considered:** At least 2–3 realistic options with pros, cons, and cost/maintenance trade-offs.
   - **Decision:** The chosen option and rationale.
   - **Consequences:** What becomes easier, what becomes harder, and what follow-up tasks or tests are required.
3. **Link in `docs/product/decisions.md`:** Add or update the corresponding entry in `docs/product/decisions.md` and `CHANGELOG.md`.
4. **Confirm before locking:** Keep status as `PROPOSED` until the Owner confirms it.
