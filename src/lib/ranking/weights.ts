/**
 * Canonical Feed Ranking v1 Weights
 * Source: Section 9 of the Rada Build Plan.
 * Protected by CODEOWNERS — Owner approval required for any modification.
 */

export const RANKING_V1_WEIGHTS = {
  interestMatch: {
    topic: 1.0,
    subcategory: 0.7,
    category: 0.4,
  },
  interactions: {
    decayDays: 30,
    save: 3,
    calendar_add: 3,
    open: 1,
    dismiss: -3,
  },
  batch: {
    defaultLimit: 20,
    outsideInterestsExplorationRatio: 0.15,
  },
} as const;
