"use client";

import { useState, useEffect, useCallback } from "react";
import { useUIStore } from "@/lib/stores/ui-store";
import { FeedItemCard } from "@/features/feed/FeedItemCard";
import type { ScoredFeedItem } from "@/lib/ranking/engine";
import type { CatalogueCategory } from "@/app/api/catalogues/route";
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
  ChevronDown,
  Bookmark,
  Sparkles,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
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

export function CataloguesView() {
  const { thumbnailsHidden } = useUIStore();
  const [categories, setCategories] = useState<CatalogueCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());

  const loadCatalogues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/catalogues");
      if (!res.ok) {
        throw new Error("Failed to load catalogues");
      }
      const data: { categories: CatalogueCategory[] } = await res.json();
      setCategories(data.categories);

      // Collect all saved item IDs
      const ids = new Set<string>();
      const catsWithItems = new Set<string>();
      data.categories.forEach((cat) => {
        if (cat.totalItems > 0) {
          catsWithItems.add(cat.id);
        }
        cat.subcategories.forEach((sub) => {
          sub.items.forEach((item) => ids.add(item.id));
        });
      });

      setSavedItemIds(ids);
      // Automatically expand categories that have items
      setExpandedCats(catsWithItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalogues();
  }, [loadCatalogues]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleUnsave = async (itemId: string) => {
    try {
      const res = await fetch(`/api/items/${itemId}/save`, { method: "DELETE" });
      if (res.ok) {
        // Update local state without full reload
        setCategories((prevCats) =>
          prevCats.map((cat) => {
            let catTotal = 0;
            const updatedSubs = cat.subcategories.map((sub) => {
              const updatedItems = sub.items.filter((item) => item.id !== itemId);
              catTotal += updatedItems.length;
              return { ...sub, items: updatedItems };
            });
            return { ...cat, subcategories: updatedSubs, totalItems: catTotal };
          }),
        );
        setSavedItemIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async (itemId: string) => {
    try {
      const res = await fetch(`/api/items/${itemId}/save`, { method: "POST" });
      if (res.ok) {
        setSavedItemIds((prev) => new Set(prev).add(itemId));
      }
    } catch {
      // ignore
    }
  };

  const handleDismiss = async (itemId: string) => {
    try {
      await fetch(`/api/items/${itemId}/dismiss`, { method: "POST" });
      await handleUnsave(itemId);
    } catch {
      // ignore
    }
  };

  const handleOpen = (itemId: string) => {
    void fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, type: "open" }),
    });
  };

  const handleAddToCalendar = (item: ScoredFeedItem) => {
    void fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, type: "calendar_add" }),
    });

    // Create calendar event
    void fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        timezone: item.timezone || "UTC",
        sourceItemId: item.id,
      }),
    });
  };

  const totalSavedCount = categories.reduce((acc, cat) => acc + cat.totalItems, 0);

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" aria-hidden="true" />
            My Catalogues
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your saved suggestions and items organized across 10 life spheres.
          </p>
        </div>
        <div className="text-sm font-medium text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg shrink-0">
          {totalSavedCount} {totalSavedCount === 1 ? "item" : "items"} saved
        </div>
      </div>

      {loading ? (
        <div className="space-y-4" aria-label="Loading catalogues…" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <button
            onClick={() => loadCatalogues()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      ) : totalSavedCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="rounded-full bg-muted p-5">
            <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-foreground">No saved items yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Save suggestions from the feed to curate your personal catalogues.
            </p>
          </div>
          <a
            href="/feed"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Explore feed
          </a>
        </div>
      ) : (
        /* 10 Category Shelves */
        <div className="space-y-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? Compass;
            const hasItems = category.totalItems > 0;
            const isExpanded = expandedCats.has(category.id);

            return (
              <div
                key={category.id}
                  className={clsx(
                    "rounded-2xl border transition-colors overflow-hidden",
                    hasItems
                      ? "border-border bg-card shadow-sm"
                      : "border-border/30 bg-muted",
                  )}
              >
                {/* Category Shelf Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        "rounded-xl p-2",
                        hasItems ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground text-base">
                        {category.name}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        {category.totalItems} {category.totalItems === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    className={clsx(
                      "h-5 w-5 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* Subcategory Shelves & Items */}
                {isExpanded && hasItems && (
                  <div className="border-t border-border/60 bg-muted/10 p-4 space-y-6">
                    {category.subcategories.map((subcategory) => {
                      if (subcategory.items.length === 0) return null;

                      return (
                        <div key={subcategory.id} className="space-y-3">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {subcategory.name} ({subcategory.items.length})
                          </h3>
                          <div className="grid gap-3">
                            {subcategory.items.map((item) => (
                              <FeedItemCard
                                key={item.id}
                                item={item as any}
                                thumbnailsHidden={thumbnailsHidden}
                                savedItemIds={savedItemIds}
                                onSave={handleSave}
                                onUnsave={handleUnsave}
                                onDismiss={handleDismiss}
                                onOpen={handleOpen}
                                onAddToCalendar={handleAddToCalendar}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
