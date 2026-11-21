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
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import taxonomyData from "@/../data/taxonomy.json";
import { useUIStore } from "@/lib/stores/ui-store";
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

interface OnboardingModalProps {
  onComplete: (subcategoryIds: string[]) => void;
  onSkip: () => void;
}

export function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<Set<string>>(new Set());
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(
    taxonomyData.categories[0]?.id ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSubcategory = useCallback((subcategoryId: string) => {
    setSelectedSubcategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(subcategoryId)) {
        next.delete(subcategoryId);
      } else {
        next.add(subcategoryId);
      }
      return next;
    });
  }, []);

  const handleComplete = useCallback(async () => {
    if (selectedSubcategoryIds.size < 3) {
      setError("Please select at least 3 interests to personalise your feed.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/me/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategoryIds: Array.from(selectedSubcategoryIds) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message ?? "Failed to save interests");
      }

      onComplete(Array.from(selectedSubcategoryIds));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [selectedSubcategoryIds, onComplete]);

  const selectedCount = selectedSubcategoryIds.size;
  const canComplete = selectedCount >= 3;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 id="onboarding-title" className="text-lg font-semibold text-foreground">
                What interests you?
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Select at least 3 areas — your feed will be personalised around them.
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            aria-label="Skip interest selection"
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Category + Subcategory Selection */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {taxonomyData.categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? Compass;
            const isExpanded = expandedCategoryId === category.id;
            const selectedInCategory = category.subcategories.filter((sub) =>
              selectedSubcategoryIds.has(sub.id),
            ).length;

            return (
              <div
                key={category.id}
                className="rounded-xl border border-border overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() =>
                    setExpandedCategoryId(isExpanded ? null : category.id)
                  }
                  aria-expanded={isExpanded}
                  aria-controls={`subcats-${category.id}`}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={clsx(
                        "h-4 w-4 shrink-0",
                        selectedInCategory > 0 ? "text-primary" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span
                      className={clsx(
                        "text-sm font-medium",
                        selectedInCategory > 0 ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {category.name}
                    </span>
                    {selectedInCategory > 0 && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {selectedInCategory}
                      </span>
                    )}
                  </div>
                  <svg
                    className={clsx(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Subcategory List */}
                {isExpanded && (
                  <div
                    id={`subcats-${category.id}`}
                    className="border-t border-border bg-muted/20 px-4 py-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.map((sub) => {
                        const isSelected = selectedSubcategoryIds.has(sub.id);
                        return (
                          <button
                            key={sub.id}
                            onClick={() => toggleSubcategory(sub.id)}
                            aria-pressed={isSelected}
                            className={clsx(
                              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                            )}
                          >
                            {isSelected && (
                              <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                            )}
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {error && (
            <p role="alert" className="text-sm text-destructive font-medium text-center">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-3 py-2"
            >
              Skip — use Variety mode
            </button>
            <div className="flex items-center gap-3">
              <span
                className={clsx(
                  "text-sm",
                  canComplete ? "text-primary font-medium" : "text-muted-foreground",
                )}
                aria-live="polite"
              >
                {selectedCount} / 3+ selected
              </span>
              <button
                onClick={handleComplete}
                disabled={!canComplete || saving}
                aria-disabled={!canComplete || saving}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  canComplete && !saving
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                {saving ? "Saving…" : "Start discovering"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
