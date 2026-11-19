"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  ExternalLink,
  Download,
  CalendarDays,
  List,
} from "lucide-react";
import { clsx } from "clsx";

export interface CalendarEventItem {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  notes: string | null;
  sourceItemId: string | null;
  reminderMinutes: number | null;
  doneAt: string | null;
  createdAt: string;
  sourceItem?: {
    id: string;
    title: string;
    url: string;
    sourceName: string;
    startsAt: string | null;
    endsAt: string | null;
  } | null;
  dateChangeNotice?: {
    hasChanged: boolean;
    sourceStartsAt: string | null;
    sourceEndsAt: string | null;
    message: string;
  } | null;
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "agenda">("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("12:00");
  const [notesInput, setNotesInput] = useState("");
  const [creating, setCreating] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/calendar/events");
      if (!res.ok) {
        if (res.status === 401) {
          setError("Please sign in to view and manage your calendar.");
          return;
        }
        throw new Error("Failed to load events");
      }
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const handleToggleDone = async (eventId: string, currentDone: boolean) => {
    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !currentDone }),
      });
      if (res.ok) {
        setEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventId
              ? { ...ev, doneAt: !currentDone ? new Date().toISOString() : null }
              : ev,
          ),
        );
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      }
    } catch {
      // ignore
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput || !dateInput) return;

    try {
      setCreating(true);
      const startDateTime = new Date(`${dateInput}T${timeInput || "00:00"}:00Z`).toISOString();
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleInput,
          startsAt: startDateTime,
          notes: notesInput || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEvents((prev) => [...prev, data.event]);
        setIsModalOpen(false);
        setTitleInput("");
        setDateInput("");
        setNotesInput("");
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthYearLabel = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Days in month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" aria-hidden="true" />
            Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track upcoming releases, events, live sessions, and saved experiences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export .ics button */}
          <a
            href="/api/calendar.ics"
            download="rada-calendar.ics"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Export iCalendar feed (.ics)"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Export</span> .ics
          </a>

          {/* View toggle (Month / Agenda) */}
          <div className="flex rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setViewMode("month")}
              aria-pressed={viewMode === "month"}
              className={clsx(
                "rounded-md p-1.5 text-xs font-medium transition-colors",
                viewMode === "month"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Month view"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              aria-pressed={viewMode === "agenda"}
              className={clsx(
                "rounded-md p-1.5 text-xs font-medium transition-colors",
                viewMode === "agenda"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Agenda view"
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* New Event Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Event
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 rounded-2xl border border-border bg-card animate-pulse" />
      ) : error ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <a
            href="/auth/signin"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign in
          </a>
        </div>
      ) : (
        <>
          {/* Month / Navigation Bar */}
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-lg font-semibold text-foreground">{monthYearLabel}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                aria-label="Previous month"
                className="rounded-md border border-border p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={nextMonth}
                aria-label="Next month"
                className="rounded-md border border-border p-1.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Month View (Default for desktop) */}
          {viewMode === "month" ? (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground py-2.5">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-border">
                {calendarDays.map((cell, idx) => {
                  const dayDateStr = cell.date.toISOString().split("T")[0];
                  const dayEvents = events.filter((ev) => ev.startsAt.startsWith(dayDateStr));

                  return (
                    <div
                      key={idx}
                      className={clsx(
                        "min-h-[100px] p-2 space-y-1 transition-colors",
                        cell.isCurrentMonth ? "bg-card" : "bg-muted/10 opacity-50",
                      )}
                    >
                      <div className="text-xs font-semibold text-foreground/80">
                        {cell.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={clsx(
                              "group relative rounded-md p-1.5 text-xs border leading-tight transition-all",
                              ev.doneAt
                                ? "bg-muted/50 border-border text-muted-foreground line-through"
                                : ev.dateChangeNotice
                                ? "bg-amber-500/10 border-amber-500/40 text-foreground"
                                : "bg-primary/10 border-primary/20 text-foreground",
                            )}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-medium truncate">{ev.title}</span>
                              <button
                                onClick={() => handleToggleDone(ev.id, !!ev.doneAt)}
                                aria-label={ev.doneAt ? "Mark as not done" : "Mark as done"}
                                className="shrink-0 text-muted-foreground hover:text-primary"
                              >
                                {ev.doneAt ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                                ) : (
                                  <Check className="h-3 w-3" aria-hidden="true" />
                                )}
                              </button>
                            </div>
                            {ev.dateChangeNotice && (
                              <div
                                title={ev.dateChangeNotice.message}
                                className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal"
                              >
                                <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
                                <span>Date updated</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Agenda View (Optimized for list/mobile) */
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  No upcoming calendar events scheduled.
                </p>
              ) : (
                events.map((ev) => {
                  const eventDate = new Date(ev.startsAt);
                  return (
                    <article
                      key={ev.id}
                      className={clsx(
                        "rounded-xl border p-4 transition-colors space-y-2",
                        ev.doneAt
                          ? "border-border bg-card/60 opacity-75"
                          : ev.dateChangeNotice
                          ? "border-amber-500/40 bg-amber-500/5"
                          : "border-border bg-card",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3
                            className={clsx(
                              "font-semibold text-base",
                              ev.doneAt ? "line-through text-muted-foreground" : "text-foreground",
                            )}
                          >
                            {ev.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                              {eventDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {ev.sourceItem && (
                              <>
                                <span>·</span>
                                <span>From: {ev.sourceItem.sourceName}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Mark Done Toggle */}
                          <button
                            onClick={() => handleToggleDone(ev.id, !!ev.doneAt)}
                            aria-label={ev.doneAt ? "Mark as not done" : "Mark as done"}
                            className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-muted"
                          >
                            {ev.doneAt ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                            ) : (
                              <Check className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>

                          {/* Source item link */}
                          {ev.sourceItem?.url && (
                            <a
                              href={ev.sourceItem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-muted"
                              title="Open source"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </a>
                          )}

                          {/* Delete Event */}
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            aria-label="Delete event"
                            className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Decision D12: Notice on date changes */}
                      {ev.dateChangeNotice && (
                        <div
                          role="alert"
                          className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200"
                        >
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <p className="font-semibold">Organizer Date Update</p>
                            <p>{ev.dateChangeNotice.message}</p>
                          </div>
                        </div>
                      )}

                      {ev.notes && <p className="text-xs text-muted-foreground">{ev.notes}</p>}
                    </article>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Create Event Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-event-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h2 id="create-event-title" className="text-lg font-semibold text-foreground">
              Add Calendar Event
            </h2>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="event-title" className="text-xs font-medium text-foreground">
                  Event Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Workshop, film premiere, or activity"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="event-date" className="text-xs font-medium text-foreground">
                    Date
                  </label>
                  <input
                    id="event-date"
                    type="date"
                    required
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="event-time" className="text-xs font-medium text-foreground">
                    Time (UTC)
                  </label>
                  <input
                    id="event-time"
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="event-notes" className="text-xs font-medium text-foreground">
                  Notes (optional)
                </label>
                <textarea
                  id="event-notes"
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Additional context or reminder details..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !titleInput || !dateInput}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {creating ? "Adding…" : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
