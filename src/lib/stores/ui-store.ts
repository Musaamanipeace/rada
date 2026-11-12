import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UIState {
  theme: "light" | "dark" | "system";
  thumbnailsHidden: boolean;
  varietyMode: boolean;
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  selectedTopicId: string | null;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setThumbnailsHidden: (hidden: boolean) => void;
  toggleThumbnailsHidden: () => void;
  setVarietyMode: (enabled: boolean) => void;
  toggleVarietyMode: () => void;
  setSelectedCategory: (id: string | null) => void;
  setSelectedSubcategory: (id: string | null) => void;
  setSelectedTopic: (id: string | null) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      thumbnailsHidden: false,
      varietyMode: false,
      selectedCategoryId: null,
      selectedSubcategoryId: null,
      selectedTopicId: null,
      setTheme: (theme) => set({ theme }),
      setThumbnailsHidden: (hidden) => set({ thumbnailsHidden: hidden }),
      toggleThumbnailsHidden: () =>
        set((state) => ({ thumbnailsHidden: !state.thumbnailsHidden })),
      setVarietyMode: (enabled) => set({ varietyMode: enabled }),
      toggleVarietyMode: () =>
        set((state) => ({ varietyMode: !state.varietyMode })),
      setSelectedCategory: (id) =>
        set({
          selectedCategoryId: id,
          selectedSubcategoryId: null,
          selectedTopicId: null,
        }),
      setSelectedSubcategory: (id) =>
        set({
          selectedSubcategoryId: id,
          selectedTopicId: null,
        }),
      setSelectedTopic: (id) => set({ selectedTopicId: id }),
      resetFilters: () =>
        set({
          selectedCategoryId: null,
          selectedSubcategoryId: null,
          selectedTopicId: null,
          varietyMode: false,
        }),
    }),
    {
      name: "rada-ui-preferences",
    }
  )
);
