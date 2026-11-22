# Phase 3: My Catalogues and Calendar

*Source: Section 11 (Phase 3), Section 8.3, and Section 8.4 of the Rada Build Plan.*
*Skill to run before coding: [`.agents/skills/start-phase/SKILL.md`](../../.agents/skills/start-phase/SKILL.md).*

## Prerequisites

- **All Phase 2 exit criteria in [`docs/phases/phase-2.md`](./phase-2.md) must be ticked.**

---

## Scope & Task Checklist

- [x] **My Catalogues (`8.3`, `D4`):**
  - [x] `POST /api/items/:id/save`, `DELETE /api/items/:id/save`, and `GET /api/catalogues`.
  - [x] Ten category shelves that expand into subcategories; empty shelves are greyed out.
  - [x] Support un-saving items (`DELETE /api/items/:id/save`) and respect `thumbnails_hidden` (`8.2`).
  - [x] Retain **Add to calendar** button on dated items (`D5`).
  - [x] Automated test proving `/api/catalogues` never returns ads (`Rule 17`).
- [x] **Calendar (`8.4`, `D5`, `D12`):**
  - [x] `GET | POST | PATCH | DELETE /api/calendar/events` and `GET /api/calendar.ics`.
  - [x] Desktop **month view** and mobile **agenda view**.
  - [x] Create, edit, and delete events manually or from a dated item (`source_item_id`).
  - [x] Source date-change notice (`D12`): when a linked source item's `starts_at`/`ends_at` changes, display a notice on the calendar event rather than silently overwriting the user's entry.
  - [x] Reminders (`reminder_minutes`) and **Mark done** (`done_at`), which forms the user's activity history.
  - [x] Standards-compliant `.ics` calendar export (`GET /api/calendar.ics`).
- [x] **Offline Read-Only Cache & Guest Merge (`8.3`, `8.4`, `Section 10`):**
  - [x] Configure Serwist caching so **My Catalogues** and **Calendar** are readable offline in read-only mode.
  - [x] Merge guest saved items and interactions into the user account upon signup.
- [x] **User Data Export & Deletion (`Section 7`, `Section 9`):**
  - [x] Implement `GET /api/me/data` and `DELETE /api/me/data`.

---

## Exit Criteria (Must All Pass Before Starting Phase 4)

- [x] Save and un-save flows work end-to-end across Feed and My Catalogues.
- [x] **Add to calendar** appears only on dated items and creates linked calendar entries accurately.
- [x] `.ics` export validates against RFC 5545 iCalendar format.
- [x] Offline read-only mode works for both My Catalogues and Calendar in Playwright offline tests.
- [x] Guest-to-account merge on signup is covered by automated tests.
