"use client";

import { clsx } from "clsx";

interface FeedSkeletonCardProps {
  thumbnailsHidden: boolean;
}

export function FeedSkeletonCard({ thumbnailsHidden }: FeedSkeletonCardProps) {
  return (
    <div
      aria-hidden="true"
      className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 sm:p-4"
    >
      {/* Thumbnail/icon skeleton */}
      <div
        className={clsx(
          "shrink-0 rounded-lg bg-muted animate-pulse",
          thumbnailsHidden ? "h-10 w-10" : "h-16 w-16 sm:h-20 sm:w-20",
        )}
      />

      {/* Content skeleton */}
      <div className="flex-1 space-y-2.5 py-0.5">
        {/* Badges */}
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-10 rounded-full bg-muted animate-pulse" />
        </div>
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
        </div>
        {/* Source */}
        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
      </div>

      {/* Action icons skeleton */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-7 rounded bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function FeedSkeletonList({ thumbnailsHidden }: { thumbnailsHidden: boolean }) {
  return (
    <div className="space-y-3" aria-label="Loading feed…" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <FeedSkeletonCard key={i} thumbnailsHidden={thumbnailsHidden} />
      ))}
    </div>
  );
}
