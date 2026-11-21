"use client";

import { useState, useCallback } from "react";
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
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  EyeOff,
  Calendar,
  Clock,
} from "lucide-react";
import { clsx } from "clsx";
import type { ScoredFeedItem } from "@/lib/ranking/engine";

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

const costBadgeClass: Record<string, string> = {
  FREE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  UNKNOWN: "bg-muted text-muted-foreground",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

interface FeedItemCardProps {
  item: ScoredFeedItem;
  thumbnailsHidden: boolean;
  savedItemIds: Set<string>;
  onSave: (itemId: string) => void;
  onUnsave: (itemId: string) => void;
  onDismiss: (itemId: string) => void;
  onOpen: (itemId: string) => void;
  onAddToCalendar: (item: ScoredFeedItem) => void;
}

export function FeedItemCard({
  item,
  thumbnailsHidden,
  savedItemIds,
  onSave,
  onUnsave,
  onDismiss,
  onOpen,
  onAddToCalendar,
}: FeedItemCardProps) {
  const isSaved = savedItemIds.has(item.id);
  const isFutureDated = item.startsAt ? new Date(item.startsAt) > new Date() : false;
  const CategoryIcon = categoryIcons[item.category.slug] ?? Compass;

  const handleSaveToggle = useCallback(() => {
    if (isSaved) {
      onUnsave(item.id);
    } else {
      onSave(item.id);
    }
  }, [isSaved, item.id, onSave, onUnsave]);

  return (
    <article
      aria-label={item.title}
      className={clsx(
        "group relative flex gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 transition-shadow hover:shadow-md",
        thumbnailsHidden ? "items-start" : "items-start",
      )}
    >
      {/* Thumbnail or Category Icon */}
      {!thumbnailsHidden ? (
        item.thumbnailUrl ? (
          <div className="relative shrink-0 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.thumbnailUrl}
              alt=""
              width={80}
              height={80}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover bg-muted"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CategoryIcon className="h-7 w-7 text-primary" aria-hidden="true" />
          </div>
        )
      ) : (
        /* Compact category icon when thumbnails hidden — zero image network requests */
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <CategoryIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        {/* Category + cost badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {item.category.name}
          </span>
          {item.cost !== "UNKNOWN" && (
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                costBadgeClass[item.cost],
              )}
            >
              {item.cost === "FREE" ? "Free" : "Paid"}
            </span>
          )}
          {isFutureDated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 text-xs font-medium">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Upcoming
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        {/* Source + date */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{item.sourceName}</span>
          {item.subcategory && (
            <>
              <span aria-hidden="true">·</span>
              <span>{item.subcategory.name}</span>
            </>
          )}
          {item.startsAt && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={new Date(item.startsAt).toISOString()}>
                {formatDate(item.startsAt)}
              </time>
            </>
          )}
        </div>

        {/* Description */}
        {item.description && !thumbnailsHidden && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 self-start">
        {/* Open in new tab */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open "${item.title}" in a new tab`}
          onClick={() => onOpen(item.id)}
          className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>

        {/* Save / Unsave */}
        <button
          onClick={handleSaveToggle}
          aria-label={isSaved ? `Remove "${item.title}" from Catalogues` : `Save "${item.title}" to Catalogues`}
          aria-pressed={isSaved}
          className={clsx(
            "rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isSaved
              ? "text-primary hover:text-primary/80 hover:bg-primary/10"
              : "text-muted-foreground hover:text-primary hover:bg-muted",
          )}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Bookmark className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {/* Add to Calendar (future-dated items only) */}
        {isFutureDated && (
          <button
            onClick={() => onAddToCalendar(item)}
            aria-label={`Add "${item.title}" to Calendar`}
            className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {/* Dismiss / Not interested */}
        <button
          onClick={() => onDismiss(item.id)}
          aria-label={`Don't show "${item.title}" again`}
          className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
