"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Share2,
  ArrowRight,
  Sparkles,
  Shield,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import taxonomyData from "@/../data/taxonomy.json";
import { t } from "@/lib/i18n";

type Step = "welcome" | "categories" | "suggestions" | "summary" | "finished";

interface SuggestionInput {
  title: string;
  url: string;
  pickType: "useful" | "impactful" | "favorite";
  topicId: string;
  note: string;
}

export function SurveyFlow() {
  const [step, setStep] = useState<Step>("welcome");
  const [consent, setConsent] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [subcategoriesToVisit, setSubcategoriesToVisit] = useState<
    Array<{
      catId: string;
      catName: string;
      subId: string;
      subName: string;
      topics: Array<{ id: string; name: string }>;
    }>
  >([]);
  const [currentSubIndex, setCurrentSubIndex] = useState(0);

  // Map subcategoryId -> SuggestionInput[]
  const [suggestionsMap, setSuggestionsMap] = useState<
    Record<string, SuggestionInput[]>
  >({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [copiedShare, setCopiedShare] = useState(false);

  // Step 1: Start Survey
  const handleStartSurvey = async () => {
    if (!consent) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/survey/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          selectedCategories: taxonomyData.categories.map((c) => c.id), // placeholder initial
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to start survey");
      }

      setSessionId(data.sessionId);
      setStep("categories");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm Category Selection
  const handleConfirmCategories = () => {
    if (selectedCatIds.length === 0) {
      setErrorMsg("Please select at least one category to continue.");
      return;
    }
    setErrorMsg(null);

    // Build linear subcategories queue
    const list: typeof subcategoriesToVisit = [];
    for (const catId of selectedCatIds) {
      const cat = taxonomyData.categories.find((c) => c.id === catId);
      if (!cat) continue;
      for (const sub of cat.subcategories) {
        list.push({
          catId: cat.id,
          catName: cat.name,
          subId: sub.id,
          subName: sub.name,
          topics: sub.topics,
        });
      }
    }

    setSubcategoriesToVisit(list);
    setCurrentSubIndex(0);
    setStep("suggestions");
  };

  const currentSub = subcategoriesToVisit[currentSubIndex];
  const currentSuggestions = currentSub ? (suggestionsMap[currentSub.subId] || []) : [];

  const handleAddSuggestion = () => {
    if (!currentSub || currentSuggestions.length >= 5) return;
    const nextList = [
      ...currentSuggestions,
      { title: "", url: "", pickType: "useful" as const, topicId: "", note: "" },
    ];
    setSuggestionsMap({
      ...suggestionsMap,
      [currentSub.subId]: nextList,
    });
  };

  const handleUpdateSuggestion = (
    index: number,
    field: keyof SuggestionInput,
    value: string
  ) => {
    if (!currentSub) return;
    const nextList = [...currentSuggestions];
    nextList[index] = { ...nextList[index], [field]: value };
    setSuggestionsMap({
      ...suggestionsMap,
      [currentSub.subId]: nextList,
    });
  };

  const handleRemoveSuggestion = (index: number) => {
    if (!currentSub) return;
    const nextList = currentSuggestions.filter((_, i) => i !== index);
    setSuggestionsMap({
      ...suggestionsMap,
      [currentSub.subId]: nextList,
    });
  };

  // Autosave and advance
  const saveCurrentSubcategory = async () => {
    if (!sessionId || !currentSub) return;

    // Filter non-empty suggestions: require both title and url
    const validPicks = currentSuggestions.filter(
      (s) => s.title.trim().length > 0 && s.url.trim().length > 0
    );

    if (validPicks.length > 0) {
      await fetch(`/api/survey/sessions/${sessionId}/suggestions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcategoryId: currentSub.subId,
          suggestions: validPicks.map((s) => ({
            title: s.title.trim(),
            url: s.url.trim(),
            pickType: s.pickType,
            topicId: s.topicId || undefined,
            note: s.note.trim() ? s.note.trim().slice(0, 140) : undefined,
          })),
        }),
      });
    }
  };

  const handleNextSubcategory = async () => {
    setLoading(true);
    await saveCurrentSubcategory();
    setLoading(false);

    if (currentSubIndex + 1 < subcategoriesToVisit.length) {
      setCurrentSubIndex(currentSubIndex + 1);
    } else {
      setStep("summary");
    }
  };

  const handlePrevSubcategory = () => {
    if (currentSubIndex > 0) {
      setCurrentSubIndex(currentSubIndex - 1);
    } else {
      setStep("categories");
    }
  };

  const handleFinishEarly = async () => {
    setLoading(true);
    await saveCurrentSubcategory();
    setLoading(false);
    setStep("summary");
  };

  // Step 4: Final submission options
  const handleFinalSubmit = async (action: "keep" | "delete") => {
    if (!sessionId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/survey/sessions/${sessionId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          email: emailInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit survey");
      }

      setStep("finished");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalSuggestionsCount = Object.values(suggestionsMap).reduce(
    (acc, list) =>
      acc +
      list.filter((s) => s.title.trim().length > 0 && s.url.trim().length > 0).length,
    0
  );

  return (
    <div className="container max-w-2xl py-12">
      {errorMsg && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-800 dark:text-red-200 mb-6"
        >
          {errorMsg}
        </div>
      )}

      {/* 1. Welcome Screen */}
      {step === "welcome" && (
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>Rada Founding Contributor Survey</span>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Help curate the discovery library
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              We are gathering the best articles, tools, videos, books, courses,
              and places across 10 life categories. Every suggestion is reviewed
              by human moderators to ensure clean, high-signal recommendations.
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-secondary/30 p-4 text-sm space-y-2">
            <div className="font-semibold flex items-center gap-2 text-foreground">
              <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
              Privacy & Moderation Commitment
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Zero third-party trackers. Your submissions are saved as{" "}
              <strong>&ldquo;submitted for review&rdquo;</strong> and will never be
              shared with third-party ad networks. You may submit anonymously or
              link your picks to an account.
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm font-medium text-foreground">
              I agree to participate in the Rada pre-launch survey and understand
              my suggestions will be reviewed by human moderators before entering
              the library.
            </span>
          </label>

          <button
            type="button"
            disabled={!consent || loading}
            onClick={handleStartSurvey}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {loading ? t.common.loading : "Get Started"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 2. Category Selection Screen */}
      {step === "categories" && (
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm flex flex-col gap-6">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              Step 1 of 3: Categories
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Which areas do you have great recommendations for?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select one or more categories. You will be able to suggest picks
              for each chosen area.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {taxonomyData.categories.map((cat) => {
              const selected = selectedCatIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      setSelectedCatIds(selectedCatIds.filter((id) => id !== cat.id));
                    } else {
                      setSelectedCatIds([...selectedCatIds, cat.id]);
                    }
                  }}
                  className={`flex items-center justify-between p-4 rounded-lg border text-left font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selected
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{cat.name}</span>
                  {selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleConfirmCategories}
            disabled={selectedCatIds.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Continue to Suggestions
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 3. Subcategory Suggestion Screens */}
      {step === "suggestions" && currentSub && (
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-3">
            <span>
              {currentSub.catName} &rsaquo;{" "}
              <strong className="text-foreground">{currentSub.subName}</strong>
            </span>
            <span>
              {currentSubIndex + 1} of {subcategoriesToVisit.length}
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Suggest items for {currentSub.subName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add up to 5 useful, impactful, or favorite items (articles, tools,
              videos, courses, etc.). Or skip to the next subcategory.
            </p>
          </div>

          {/* Suggestions List */}
          <div className="flex flex-col gap-4">
            {currentSuggestions.map((sugg, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border p-4 bg-secondary/20 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Suggestion #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSuggestion(idx)}
                    aria-label={`Remove suggestion ${idx + 1}`}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Title (Required)
                    </label>
                    <input
                      type="text"
                      value={sugg.title}
                      onChange={(e) =>
                        handleUpdateSuggestion(idx, "title", e.target.value)
                      }
                      placeholder="e.g. Duolingo or Khan Academy"
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Link / URL (Required)
                    </label>
                    <input
                      type="text"
                      value={sugg.url}
                      onChange={(e) =>
                        handleUpdateSuggestion(idx, "url", e.target.value)
                      }
                      placeholder="e.g. duolingo.com or https://..."
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Pick Type (Required)
                    </label>
                    <select
                      value={sugg.pickType}
                      onChange={(e) =>
                        handleUpdateSuggestion(
                          idx,
                          "pickType",
                          e.target.value as any
                        )
                      }
                      className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="useful">Useful</option>
                      <option value="impactful">Impactful</option>
                      <option value="favorite">Favorite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Topic (Optional)
                    </label>
                    <select
                      value={sugg.topicId}
                      onChange={(e) =>
                        handleUpdateSuggestion(idx, "topicId", e.target.value)
                      }
                      className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">(Select topic)</option>
                      {currentSub.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <label>Short Note (Optional)</label>
                    <span className="text-muted-foreground font-normal">
                      {140 - (sugg.note?.length || 0)} left
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={140}
                    value={sugg.note}
                    onChange={(e) =>
                      handleUpdateSuggestion(idx, "note", e.target.value)
                    }
                    placeholder="Why do you recommend this? (max 140 chars)"
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            ))}

            {currentSuggestions.length < 5 && (
              <button
                type="button"
                onClick={handleAddSuggestion}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-md border border-dashed border-border bg-card text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="h-4 w-4" />
                Add a Suggestion ({currentSuggestions.length}/5)
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={handlePrevSubcategory}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleFinishEarly}
                className="text-xs text-muted-foreground hover:underline"
              >
                Finish survey now
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleNextSubcategory}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {currentSubIndex + 1 === subcategoriesToVisit.length
                  ? "Review & Finish"
                  : currentSuggestions.length === 0
                  ? "Skip"
                  : "Save & Next"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Summary & Decision Screen */}
      {step === "summary" && (
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Final Step: Summary &amp; Submission
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You suggested {totalSuggestionsCount} item{totalSuggestionsCount === 1 ? "" : "s"}.
              All suggestions are <strong>submitted for review</strong> by
              our moderators before being approved for the discovery feed.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground space-y-2">
            <div className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              How would you like to submit your answers?
            </div>
            <p>
              Per our transparent privacy rules (Decision D9 &amp; Open Question O8),
              you can choose whether to link your picks to a new account, leave them
              anonymously for library curation, or erase them now.
            </p>
          </div>

          {totalSuggestionsCount > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <h3 className="font-semibold text-sm text-foreground">
                Your Recommendations (Clickable Title Previews):
              </h3>
              <ul className="divide-y divide-border text-sm">
                {Object.entries(suggestionsMap).flatMap(([subId, list]) =>
                  list
                    .filter((s) => s.title.trim().length > 0 && s.url.trim().length > 0)
                    .map((s, sIdx) => {
                      const displayUrl = s.url.startsWith("http") ? s.url : `https://${s.url}`;
                      return (
                        <li key={`${subId}-${sIdx}`} className="py-2.5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <a
                              href={displayUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline inline-flex items-center gap-1.5"
                            >
                              <span className="truncate">{s.title}</span>
                              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            </a>
                            <div className="text-xs text-muted-foreground truncate">{displayUrl}</div>
                            {s.note && (
                              <p className="text-xs text-muted-foreground italic mt-0.5">&ldquo;{s.note}&rdquo;</p>
                            )}
                          </div>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-secondary shrink-0">
                            {s.pickType}
                          </span>
                        </li>
                      );
                    })
                )}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* Option A: Keep & Create Account */}
            <div className="rounded-lg border border-border p-4 bg-card flex flex-col gap-3">
              <h3 className="font-semibold text-base text-foreground">
                Option A: Link to my account (Recommended)
              </h3>
              <p className="text-xs text-muted-foreground">
                Save your recommendations to your profile so you can revisit them
                when Rada launches.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  disabled={!emailInput || loading}
                  onClick={() => handleFinalSubmit("keep")}
                  className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
                >
                  Submit &amp; Link
                </button>
              </div>
            </div>

            {/* Option B: Submit Anonymously */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
              <div>
                <h3 className="font-semibold text-sm text-foreground">
                  Option B: Submit Anonymously
                </h3>
                <p className="text-xs text-muted-foreground">
                  Retained without a name to help train and curate the feed.
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleFinalSubmit("keep")}
                className="rounded-md border border-input bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-muted"
              >
                Submit Anonymously
              </button>
            </div>

            {/* Option C: Delete My Answers */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20">
              <div>
                <h3 className="font-semibold text-sm text-red-700 dark:text-red-300">
                  Option C: Delete My Answers
                </h3>
                <p className="text-xs text-red-600/80 dark:text-red-400/80">
                  Permanently erases all submitted suggestions immediately.
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleFinalSubmit("delete")}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
              >
                Delete Answers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Finished Screen */}
      {step === "finished" && (
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm text-center flex flex-col items-center gap-6">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Thank You for Contributing!
            </h1>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
              Your recommendations have been <strong>submitted for review</strong>.
              Our moderation team reviews every pick against our quality checklist
              to build a calm, high-signal discovery experience.
            </p>
          </div>

          <div className="w-full max-w-sm rounded-lg border border-border bg-secondary/30 p-4 text-xs text-muted-foreground flex items-center justify-between">
            <span>Invite fellow curators:</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + "/survey");
                setCopiedShare(true);
                setTimeout(() => setCopiedShare(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copiedShare ? "Link Copied!" : "Copy Survey Link"}
            </button>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
          >
            Return to Homepage
          </Link>
        </div>
      )}
    </div>
  );
}
