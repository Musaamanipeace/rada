"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useUIStore } from "@/lib/stores/ui-store";
import { FeedHeader, type FeedFilters } from "@/features/feed/FeedHeader";
import { FeedItemCard } from "@/features/feed/FeedItemCard";
import { FeedSkeletonList } from "@/features/feed/FeedSkeleton";
import { OnboardingModal } from "@/features/onboarding/OnboardingModal";
import type { ScoredFeedItem } from "@/lib/ranking/engine";
import { Sparkles, RefreshCw } from "lucide-react";
import { clsx } from "clsx";

interface DiscoveryFeedProps {
  hasInterests: boolean;
  isAuthenticated: boolean;
}

export function DiscoveryFeed({ hasInterests, isAuthenticated }: DiscoveryFeedProps) {
  const { thumbnailsHidden, toggleThumbnailsHidden, varietyMode, setVarietyMode } = useUIStore();

  const [filters, setFilters] = useState<FeedFilters>({
    categories: [],
    varietyMode: false,
    cost: null,
    upcoming: false,
    local: false,
  });

  const [items, setItems] = useState<ScoredFeedItem[]>([]);
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
  const [seenItemIds, setSeenItemIds] = useState<Set<string>>(new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [recycled, setRecycled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(!hasInterests && !isAuthenticated === false);

  const parentRef = useRef<HTMLDivElement>(null);

  const buildFeedUrl = useCallback(
    (cursor?: string) => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");

      const activeFilters = filters;
      if (activeFilters.varietyMode) {
        params.set("mode", "variety");
      } else if (activeFilters.categories.length > 0) {
        params.set("categories", activeFilters.categories.join(","));
      }
      if (activeFilters.cost) params.set("cost", activeFilters.cost);
      if (activeFilters.upcoming) params.set("upcoming", "true");
      if (activeFilters.local) params.set("local", "true");

      // Pass session seen IDs for exhaustion detection (max 200 to stay within URL limits)
      if (seenItemIds.size > 0) {
        const seenArray = Array.from(seenItemIds).slice(-200);
        params.set("seen", seenArray.join(","));
      }

      return `/api/feed?${params.toString()}`;
    },
    [filters, seenItemIds],
  );

  const loadFeed = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setItems([]);
        setNextCursor(null);
        setSeenItemIds(new Set());
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const cursor = reset ? undefined : nextCursor ?? undefined;
        const url = buildFeedUrl(cursor);
        const res = await fetch(url);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data?.error?.message ?? "Failed to load feed");
        }

        const data: { items: ScoredFeedItem[]; nextCursor: string | null; recycled: boolean } =
          await res.json();

        setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
        setNextCursor(data.nextCursor);
        setRecycled(data.recycled);

        // Track seen IDs
        setSeenItemIds((prev) => {
          const next = new Set(prev);
          data.items.forEach((item) => next.add(item.id));
          return next;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildFeedUrl, nextCursor],
  );

  // Initial load + reload when filters change
  useEffect(() => {
    void loadFeed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Virtualizer setup
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => thumbnailsHidden ? 90 : 120,
    overscan: 5,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll: load more when reaching end
  useEffect(() => {
    if (!virtualItems.length) return;
    const lastItem = virtualItems[virtualItems.length - 1];
    if (lastItem.index >= items.length - 5 && nextCursor && !loadingMore) {
      void loadFeed(false);
    }
  }, [virtualItems, items.length, nextCursor, loadingMore, loadFeed]);

  // Actions
  const handleSave = useCallback(async (itemId: string) => {
    setSavedItemIds((prev) => new Set([...prev, itemId]));
    try {
      await fetch(`/api/items/${itemId}/save`, { method: "POST" });
    } catch {
      setSavedItemIds((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
    }
  }, []);

  const handleUnsave = useCallback(async (itemId: string) => {
    setSavedItemIds((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
    try {
      await fetch(`/api/items/${itemId}/save`, { method: "DELETE" });
    } catch {
      setSavedItemIds((prev) => new Set([...prev, itemId]));
    }
  }, []);

  const handleDismiss = useCallback(async (itemId: string) => {
    // Optimistically remove from feed
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await fetch(`/api/items/${itemId}/dismiss`, { method: "POST" });
    } catch {
      // Silently ignore — dismissed items reappear on next load only
    }
  }, []);

  const handleOpen = useCallback(async (itemId: string) => {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, type: "open" }),
      });
    } catch {
      // Non-critical: interaction recording failure doesn't break UX
    }
  }, []);

  const handleAddToCalendar = useCallback(async (item: ScoredFeedItem) => {
    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, type: "calendar_add" }),
      });
      // Also create calendar event
      await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
          timezone: item.timezone ?? "UTC",
          sourceItemId: item.id,
        }),
      });
    } catch {
      // Non-critical
    }
  }, []);

  const handleOnboardingComplete = useCallback(
    (subcategoryIds: string[]) => {
      setShowOnboarding(false);
      setFilters((prev) => ({ ...prev, varietyMode: false }));
      void loadFeed(true);
    },
    [loadFeed],
  );

  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
    setFilters((prev) => ({ ...prev, varietyMode: true }));
    setVarietyMode(true);
  }, [setVarietyMode]);

  return (
    <>
      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Feed header */}
      <FeedHeader
        filters={filters}
        thumbnailsHidden={thumbnailsHidden}
        onFiltersChange={(newFilters) => setFilters(newFilters)}
        onThumbnailsToggle={toggleThumbnailsHidden}
      />

      {/* Recycled notice */}
      {recycled && !loading && (
        <div
          role="status"
          aria-live="polite"
          className="container max-w-3xl pt-3"
        >
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            You&apos;ve seen everything matching these filters. Showing earlier items again.
          </div>
        </div>
      )}

      {/* Feed content */}
      <main id="main-content" className="container max-w-3xl pt-4 pb-20">
        {loading ? (
          <FeedSkeletonList thumbnailsHidden={thumbnailsHidden} />
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3"
          >
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              onClick={() => loadFeed(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-full bg-muted p-5">
              <Sparkles className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-foreground">
                No items match your active filters
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Try adjusting or clearing your filters to see more content.
              </p>
            </div>
            <button
              onClick={() =>
                setFilters({
                  categories: [],
                  varietyMode: false,
                  cost: null,
                  upcoming: false,
                  local: false,
                })
              }
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Virtualized list */
          <div
            ref={parentRef}
            className="overflow-auto"
            style={{ height: "calc(100vh - 180px)" }}
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const item = items[virtualRow.index];
                if (!item) return null;
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: "12px",
                    }}
                  >
                    <FeedItemCard
                      item={item}
                      thumbnailsHidden={thumbnailsHidden}
                      savedItemIds={savedItemIds}
                      onSave={handleSave}
                      onUnsave={handleUnsave}
                      onDismiss={handleDismiss}
                      onOpen={handleOpen}
                      onAddToCalendar={handleAddToCalendar}
                    />
                  </div>
                );
              })}
            </div>

            {/* Load more indicator */}
            {loadingMore && (
              <div
                role="status"
                aria-live="polite"
                className="flex justify-center py-6"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading more…
                </div>
              </div>
            )}

            {/* End of feed */}
            {!nextCursor && !loadingMore && items.length > 0 && (
              <p
                className="py-8 text-center text-sm text-muted-foreground"
                aria-live="polite"
              >
                You&apos;ve reached the end. More content is added regularly.
              </p>
            )}
          </div>
        )}
      </main>
    </>
  );
}
