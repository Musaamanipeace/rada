"use client";

import { useCallback } from "react";
import type { LucideProps } from "lucide-react";
import {
  BookOpen,
  Tv,
  Headphones,
  Gamepad2,
  GraduationCap,
  Hammer,
  Compass,
  Activity,
  Coffee,
  Users,
  Eye,
  EyeOff,
  Sparkles,
  X,
} from "lucide-react";
import taxonomyData from "@/../data/taxonomy.json";
import { clsx } from "clsx";

type IconComponent = React.ComponentType<LucideProps>;

const categoryIcons: Record<string, IconComponent> = {
  read: BookOpen,
  watch: Tv,
  listen: Headphones,
  play: Gamepad2,
  learn: GraduationCap,
  "make-and-explore": Hammer,
  "attend-and-experience": Compass,
  "improve-and-contribute": Activity,
  "earn-and-build": Coffee,
  connect: Users,
};

export interface FeedFilters {
  categories: string[]; // category slugs (empty = use user interests)
  varietyMode: boolean;
  cost: "free" | "paid" | null;
  upcoming: boolean;
  local: boolean;
}

interface FeedHeaderProps {
  filters: FeedFilters;
  thumbnailsHidden: boolean;
  onFiltersChange: (filters: FeedFilters) => void;
  onThumbnailsToggle: () => void;
}

export function FeedHeader({
  filters,
  thumbnailsHidden,
  onFiltersChange,
  onThumbnailsToggle,
}: FeedHeaderProps) {
  const toggleCategory = useCallback(
    (slug: string) => {
      onFiltersChange({
        ...filters,
        varietyMode: false,
        categories: filters.categories.includes(slug)
          ? filters.categories.filter((c) => c !== slug)
          : [...filters.categories, slug],
      });
    },
    [filters, onFiltersChange],
  );

  const toggleVariety = useCallback(() => {
    onFiltersChange({
      ...filters,
      varietyMode: !filters.varietyMode,
      categories: [],
    });
  }, [filters, onFiltersChange]);

  const toggleCost = useCallback(
    (value: "free" | "paid") => {
      onFiltersChange({
        ...filters,
        cost: filters.cost === value ? null : value,
      });
    },
    [filters, onFiltersChange],
  );

  const toggleUpcoming = useCallback(() => {
    onFiltersChange({ ...filters, upcoming: !filters.upcoming });
  }, [filters, onFiltersChange]);

  const toggleLocal = useCallback(() => {
    onFiltersChange({ ...filters, local: !filters.local });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      categories: [],
      varietyMode: false,
      cost: null,
      upcoming: false,
      local: false,
    });
  }, [onFiltersChange]);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.varietyMode ||
    filters.cost !== null ||
    filters.upcoming ||
    filters.local;

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
      <div className="container max-w-3xl py-2 space-y-2">
        {/* Row 1: Scrollable category chips */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
          role="group"
          aria-label="Category filters"
        >
          {/* Variety chip */}
          <button
            onClick={toggleVariety}
            aria-pressed={filters.varietyMode}
            className={clsx(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filters.varietyMode
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Variety
          </button>

          {/* Category chips */}
          {taxonomyData.categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? Compass;
            const isActive = filters.categories.includes(category.slug);
            return (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.slug)}
                aria-pressed={isActive}
                className={clsx(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" aria-hidden="true" />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* Row 2: Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Free toggle */}
          <button
            onClick={() => toggleCost("free")}
            aria-pressed={filters.cost === "free"}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filters.cost === "free"
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "border-input bg-background text-muted-foreground hover:border-green-400 hover:text-foreground",
            )}
          >
            Free
          </button>

          {/* Paid toggle */}
          <button
            onClick={() => toggleCost("paid")}
            aria-pressed={filters.cost === "paid"}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filters.cost === "paid"
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "border-input bg-background text-muted-foreground hover:border-amber-400 hover:text-foreground",
            )}
          >
            Paid
          </button>

          {/* Upcoming toggle */}
          <button
            onClick={toggleUpcoming}
            aria-pressed={filters.upcoming}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filters.upcoming
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "border-input bg-background text-muted-foreground hover:border-blue-400 hover:text-foreground",
            )}
          >
            Upcoming
          </button>

          {/* Local toggle */}
          <button
            onClick={toggleLocal}
            aria-pressed={filters.local}
            className={clsx(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filters.local
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            Local
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full border border-input bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Clear filters
            </button>
          )}

          {/* Hide thumbnails toggle */}
          <button
            onClick={onThumbnailsToggle}
            aria-pressed={thumbnailsHidden}
            aria-label={thumbnailsHidden ? "Show thumbnails" : "Hide thumbnails"}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              thumbnailsHidden
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {thumbnailsHidden ? (
              <Eye className="h-3 w-3" aria-hidden="true" />
            ) : (
              <EyeOff className="h-3 w-3" aria-hidden="true" />
            )}
            {thumbnailsHidden ? "Show" : "Hide"} thumbnails
          </button>
        </div>
      </div>
    </header>
  );
}
