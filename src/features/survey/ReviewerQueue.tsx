"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  GitMerge,
  ExternalLink,
  ShieldAlert,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface CoverageItem {
  subcategoryId: string;
  subcategoryName: string;
  categoryName: string;
  approvedCount: number;
  target: number;
  targetMet: boolean;
}

interface PendingSuggestion {
  id: string;
  titleOrUrl: string;
  pickType: string;
  note?: string | null;
  topicId?: string | null;
  subcategory: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
    topics: Array<{
      id: string;
      name: string;
    }>;
  };
}

interface PendingItem {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  description?: string | null;
  category: { name: string };
  subcategory: { name: string };
  topic: { name: string };
}

export function ReviewerQueue() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<CoverageItem[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<PendingSuggestion[]>([]);
  const [items, setItems] = useState<PendingItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Record<string, string>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/review-queue", {
        headers: { "x-mock-role": "reviewer" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to load review queue");
      }
      setCoverage(data.coverage);
      setSummary(data.summary);
      setSuggestions(data.pendingSuggestions);
      setItems(data.pendingItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (
    id: string,
    type: "suggestion" | "item",
    action: "approve" | "reject" | "merge",
    extra: Record<string, any> = {}
  ) => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/admin/review-queue/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-mock-role": "reviewer",
        },
        body: JSON.stringify({
          type,
          action,
          topicId: selectedTopic[id] || extra.topicId,
          ...extra,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || "Action failed");
        return;
      }

      await fetchQueue();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading && !summary) {
    return (
      <div className="container py-12 text-center text-muted-foreground">
        Loading review queue and coverage dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <div className="rounded-md border border-red-300 bg-red-50 p-6 text-center text-red-800">
          <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-red-600" />
          <h2 className="text-lg font-bold">Access Denied or Error</h2>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-6xl flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Content Reviewer Queue
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review suggestions and seed content. Target: ≥ 10 approved items per
            subcategory before launch.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Coverage Dashboard */}
      {summary && (
        <section aria-labelledby="coverage-heading" className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 id="coverage-heading" className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Subcategory Coverage Dashboard
              </h2>
              <p className="text-xs text-muted-foreground">
                Progress: {summary.metSubcategories} of {summary.totalSubcategories} subcategories
                at target ({summary.totalApproved} approved items total)
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-primary">
                {summary.percentComplete}%
              </span>
              <span className="text-xs text-muted-foreground ml-1.5">to launch threshold</span>
            </div>
          </div>

          {/* Subcategories grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border rounded-md">
            {coverage.map((sub) => (
              <div
                key={sub.subcategoryId}
                className={`p-2 rounded text-xs flex flex-col justify-between ${
                  sub.targetMet
                    ? "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-200"
                    : "bg-secondary/40 text-foreground"
                }`}
              >
                <span className="font-semibold truncate">{sub.subcategoryName}</span>
                <span className="text-[10px] opacity-80">
                  {sub.approvedCount} / {sub.target}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Review Queue: Pending Survey Suggestions */}
      <section aria-labelledby="suggestions-queue-heading">
        <h2 id="suggestions-queue-heading" className="text-xl font-bold tracking-tight mb-4">
          Pending Survey Suggestions ({suggestions.length})
        </h2>

        {suggestions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No pending survey suggestions in the review queue.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {suggestions.map((sugg) => (
              <div
                key={sugg.id}
                className="rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {sugg.subcategory.category.name}
                    </span>
                    <span>&rsaquo;</span>
                    <span>{sugg.subcategory.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-secondary">
                      {sugg.pickType}
                    </span>
                  </div>

                  <div className="font-bold text-base text-foreground flex items-center gap-2">
                    <span>{sugg.titleOrUrl}</span>
                    {sugg.titleOrUrl.startsWith("http") && (
                      <a
                        href={sugg.titleOrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:opacity-80"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {sugg.note && (
                    <p className="text-xs text-muted-foreground italic">
                      &ldquo;{sugg.note}&rdquo;
                    </p>
                  )}

                  {/* Level-3 Topic Selection (Mandatory for approval per D2, Rule 5) */}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs font-semibold text-foreground">
                      Level 3 Topic:
                    </label>
                    <select
                      value={selectedTopic[sugg.id] || sugg.topicId || ""}
                      onChange={(e) =>
                        setSelectedTopic({
                          ...selectedTopic,
                          [sugg.id]: e.target.value,
                        })
                      }
                      className="rounded border border-input bg-background px-2 py-1 text-xs"
                    >
                      <option value="">(Select topic to approve)</option>
                      {sugg.subcategory.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      actionInProgress === sugg.id ||
                      (!selectedTopic[sugg.id] && !sugg.topicId)
                    }
                    onClick={() => handleAction(sugg.id, "suggestion", "approve")}
                    className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={actionInProgress === sugg.id}
                    onClick={() => handleAction(sugg.id, "suggestion", "reject")}
                    className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Review Queue: Pending Items (CSV Imports) */}
      <section aria-labelledby="items-queue-heading">
        <h2 id="items-queue-heading" className="text-xl font-bold tracking-tight mb-4">
          Pending Seed Items ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No pending seed items in the queue.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-card p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{item.category.name}</span>
                    <span>&rsaquo;</span>
                    <span>{item.subcategory.name}</span>
                    <span>&rsaquo;</span>
                    <span className="text-primary font-medium">{item.topic.name}</span>
                  </div>

                  <div className="font-bold text-base text-foreground flex items-center gap-2">
                    <span>{item.title}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      by {item.sourceName}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={actionInProgress === item.id}
                    onClick={() => handleAction(item.id, "item", "approve")}
                    className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-green-700"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Approve
                  </button>

                  <button
                    type="button"
                    disabled={actionInProgress === item.id}
                    onClick={() => handleAction(item.id, "item", "reject")}
                    className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
