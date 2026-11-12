import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/lib/stores/ui-store";

describe("UI Preferences Store", () => {
  beforeEach(() => {
    useUIStore.getState().resetFilters();
  });

  it("defaults thumbnailsHidden to false per D6", () => {
    expect(useUIStore.getState().thumbnailsHidden).toBe(false);
  });

  it("can toggle thumbnailsHidden", () => {
    useUIStore.getState().toggleThumbnailsHidden();
    expect(useUIStore.getState().thumbnailsHidden).toBe(true);

    useUIStore.getState().toggleThumbnailsHidden();
    expect(useUIStore.getState().thumbnailsHidden).toBe(false);
  });

  it("defaults varietyMode to false per D3", () => {
    expect(useUIStore.getState().varietyMode).toBe(false);
  });

  it("resets nested taxonomy filters when changing category", () => {
    useUIStore.getState().setSelectedCategory("cat-1");
    useUIStore.getState().setSelectedSubcategory("sub-1");
    useUIStore.getState().setSelectedTopic("top-1");

    expect(useUIStore.getState().selectedCategoryId).toBe("cat-1");
    expect(useUIStore.getState().selectedSubcategoryId).toBe("sub-1");
    expect(useUIStore.getState().selectedTopicId).toBe("top-1");

    useUIStore.getState().setSelectedCategory("cat-2");
    expect(useUIStore.getState().selectedCategoryId).toBe("cat-2");
    expect(useUIStore.getState().selectedSubcategoryId).toBeNull();
    expect(useUIStore.getState().selectedTopicId).toBeNull();
  });
});
