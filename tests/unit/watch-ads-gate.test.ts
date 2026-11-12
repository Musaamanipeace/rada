import { describe, it, expect } from "vitest";
import { isWatchAdsEnabled } from "@/lib/config";

describe("Watch Ads Feature Gate (D23, Rule 21)", () => {
  it("defaults to false at launch", () => {
    expect(isWatchAdsEnabled).toBe(false);
  });
});
