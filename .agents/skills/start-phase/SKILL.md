---
name: start-phase
description: Use at the start of any phase or when asked to continue the build. Checks prerequisites, loads scope and creates the working checklist.
---

# Start Phase (`start-phase`)

Follow these steps strictly whenever starting or continuing a build phase in Rada:

1. Read `AGENTS.md`, `docs/phases/phase-N.md`, and the matching section of the master plan (`Rada Build Plan, Agent Rules and Skills.md`, Section 11).
2. Confirm every exit criterion of `phase-(N-1)` is ticked in `docs/phases/phase-(N-1).md` (skip for Phase 0). If any previous exit criterion is not met, **stop immediately** and report which criteria remain open.
3. Read `docs/product/open-questions.md` (Section 3 of the master plan), list all `TBD` items that touch this phase, and explicitly mark them out of scope. (Note: Phase 6 cannot start until the open items it depends on in `docs/product/open-questions.md` are answered.)
4. Create branch `phase-N/<topic>` off `main` and ensure the task list in `docs/phases/phase-N.md` is formatted as an active status checklist.
5. Report the plan before coding:
   - Tasks to complete in this increment
   - Execution order
   - Risks and mitigations
   - Open questions or `TBD` exclusions
