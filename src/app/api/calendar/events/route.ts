import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { apiError, apiSuccess } from "@/lib/api-response";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  startsAt: z.string().datetime({ message: "Invalid ISO date for startsAt" }),
  endsAt: z.string().datetime({ message: "Invalid ISO date for endsAt" }).optional().nullable(),
  timezone: z.string().default("UTC"),
  notes: z.string().max(1000).optional().nullable(),
  sourceItemId: z.string().optional().nullable(),
  reminderMinutes: z.number().int().min(0).max(10080).optional().nullable(), // max 7 days in mins
});

/**
 * GET /api/calendar/events
 * Lists calendar events within a date range, including source item date-change notice (D12).
 * Auth: Requires authenticated user or active guest token.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionContext();

  // If user is guest without user record, resolve userId if possible or return events for user
  const userId = session.userId;
  if (!userId) {
    return apiError("UNAUTHORIZED", "Please sign in to access your calendar", 401);
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const whereClause: any = { userId };
  if (fromParam || toParam) {
    whereClause.startsAt = {};
    if (fromParam) whereClause.startsAt.gte = new Date(fromParam);
    if (toParam) whereClause.startsAt.lte = new Date(toParam);
  }

  const events = await db.calendarEvent.findMany({
    where: whereClause,
    include: {
      sourceItem: {
        select: {
          id: true,
          title: true,
          url: true,
          sourceName: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  // Check for Decision D12: source date-change notice
  const enrichedEvents = events.map((event) => {
    let dateChangeNotice: {
      hasChanged: boolean;
      sourceStartsAt: Date | null;
      sourceEndsAt: Date | null;
      message: string;
    } | null = null;

    if (event.sourceItem && event.sourceItem.startsAt) {
      const eventTime = event.startsAt.getTime();
      const sourceTime = event.sourceItem.startsAt.getTime();

      // If difference is more than 60 seconds (accounting for millisecond variations)
      if (Math.abs(eventTime - sourceTime) > 60000) {
        dateChangeNotice = {
          hasChanged: true,
          sourceStartsAt: event.sourceItem.startsAt,
          sourceEndsAt: event.sourceItem.endsAt,
          message: `The organizer updated the date for this item to ${event.sourceItem.startsAt.toLocaleDateString()}. Your calendar event was preserved.`,
        };
      }
    }

    return {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      timezone: event.timezone,
      notes: event.notes,
      sourceItemId: event.sourceItemId,
      reminderMinutes: event.reminderMinutes,
      doneAt: event.doneAt,
      createdAt: event.createdAt,
      sourceItem: event.sourceItem,
      dateChangeNotice,
    };
  });

  return apiSuccess({ events: enrichedEvents });
}

/**
 * POST /api/calendar/events
 * Creates a calendar event manually or linked to a source item.
 */
export async function POST(request: NextRequest) {
  const session = await getSessionContext();
  const userId = session.userId;
  if (!userId) {
    return apiError("UNAUTHORIZED", "Please sign in to add calendar events", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Invalid event parameters",
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;

  // If sourceItemId provided, verify it exists
  if (data.sourceItemId) {
    const item = await db.item.findUnique({
      where: { id: data.sourceItemId },
      select: { id: true, startsAt: true },
    });
    if (!item) {
      return apiError("NOT_FOUND", "Source item not found", 404);
    }
  }

  const event = await db.calendarEvent.create({
    data: {
      userId,
      title: data.title,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      timezone: data.timezone,
      notes: data.notes,
      sourceItemId: data.sourceItemId,
      reminderMinutes: data.reminderMinutes,
    },
    include: {
      sourceItem: {
        select: {
          id: true,
          title: true,
          url: true,
          sourceName: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  });

  return apiSuccess({ event }, 201);
}
