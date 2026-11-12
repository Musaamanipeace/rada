import { describe, it, expect } from "vitest";
import { RANKING_V1_WEIGHTS } from "@/lib/ranking/weights";

describe("Canonical Feed Ranking v1 Weights", () => {
  it("matches the build plan specification exactly", () => {
    // Interest matches
    expect(RANKING_V1_WEIGHTS.interestMatch.topic).toBe(1.0);
    expect(RANKING_V1_WEIGHTS.interestMatch.subcategory).toBe(0.7);
    expect(RANKING_V1_WEIGHTS.interestMatch.category).toBe(0.4);

    // Interaction signals
    expect(RANKING_V1_WEIGHTS.interactions.save).toBe(3);
    expect(RANKING_V1_WEIGHTS.interactions.calendar_add).toBe(3);
    expect(RANKING_V1_WEIGHTS.interactions.open).toBe(1);
    expect(RANKING_V1_WEIGHTS.interactions.dismiss).toBe(-3);
    expect(RANKING_V1_WEIGHTS.interactions.decayDays).toBe(30);

    // Exploration quota
    expect(RANKING_V1_WEIGHTS.batch.defaultLimit).toBe(20);
    expect(RANKING_V1_WEIGHTS.batch.outsideInterestsExplorationRatio).toBe(0.15);
  });
});
