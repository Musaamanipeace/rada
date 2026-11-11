# Contributing to Rada

Thank you for contributing to Rada. Please read [`AGENTS.md`](./AGENTS.md) and the current phase document in [`docs/phases/`](./docs/phases/) before starting any work.

## Roles

- **Owner:** Final decisions, owner-gated approvals (`CODEOWNERS`), and final merge authority.
- **Maintainer:** Reviews pull requests and merges approved changes.
- **Contributor:** Opens pull requests following phase specifications and repository rules.
- **Content Reviewer:** Accesses the review queue only (no code access); reviews submitted items as well as advertisers and ads.
- **Agent:** Autonomous coding assistant; opens pull requests following [`AGENTS.md`](./AGENTS.md) and `.agents/skills/`, never merges directly.

## Branching & Pull Request Workflow

- **Branch naming:** Create short-lived branches off `main` named `phase-N/<topic>` (e.g., `phase-0/initial-tooling`).
- **PR size:** Keep PRs small and focused (approximately 400 changed lines at most).
- **Commits:** Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`).
- **Merging:** Squash merge into `main`. Requires at least one human approval and all CI checks passing.
- **Protected main:** Never push directly to `main` and never force-push to shared branches.
- **Documentation in-sync:** Any change to behaviour, database schema, API endpoints, or taxonomy must update its corresponding documentation (`docs/architecture/api.md`, `docs/architecture/data-model.md`, `docs/taxonomy.md`, `docs/phases/phase-N.md`, `CHANGELOG.md`) in the **same PR**.
- **Architecture Decision Records (ADRs):** Any decision costing more than a day to reverse, or any new outbound network request or major dependency, requires an ADR in `docs/architecture/adr/`.

## CODEOWNERS (Owner Approval Required)

Changes to any of the following paths require explicit approval from the Owner:

- `data/taxonomy.json`
- `docs/privacy.md`
- `docs/ad-policy.md`
- `src/lib/ranking/`
- `src/lib/ads/billing/`
- `prisma/migrations/` (database migrations)
- `AGENTS.md`

## Issues & Decision Tracking

We use the following issue labels:

- `phase-0` through `phase-7`
- `bug`
- `feature`
- `docs`
- `blocked`
- `needs-decision`
- `good-first-issue`

> **Important:** If you encounter an ambiguity or unconfirmed requirement, do **not** guess. Log the question in [`docs/product/open-questions.md`](./docs/product/open-questions.md) and open an issue labeled `needs-decision`. A `needs-decision` issue is closed **only** by recording the owner's answer in [`docs/product/decisions.md`](./docs/product/decisions.md).

## Onboarding a Collaborator

1. Clone the repository and follow the Quick Start in [`README.md`](./README.md) (target: running locally in under 10 minutes).
2. Read [`AGENTS.md`](./AGENTS.md) and the active phase document in [`docs/phases/`](./docs/phases/).
3. Pick an open issue labeled `good-first-issue` for the current phase.

## Moderation Guidelines

- **Content items:** Reviewers follow [`docs/content-moderation.md`](./docs/content-moderation.md) to verify each item's category/subcategory/topic, working URL, duplicate status, and safety/accuracy before publishing.
- **Advertisers and ads:** Reviewers follow [`docs/ad-policy.md`](./docs/ad-policy.md) to verify advertiser identity, free-allowance eligibility (one per business and website), ad creative compliance, captions/alt text, and absence of third-party tracking.

## Housekeeping

- `.env.example` must document every environment variable used by the application. Never commit `.env` files or secrets.
- A project licence (`LICENSE`) and contributor agreement must be finalized by the Owner before inviting external contributors (tracked in [`docs/product/open-questions.md`](./docs/product/open-questions.md)).
