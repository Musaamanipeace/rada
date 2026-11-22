import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { apiError, apiSuccess } from "@/lib/api-response";

const patchEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().nullable(),
  timezone: z.string().optional(),
  notes: z.string().max(1000).optional().nullable(),
  reminderMinutes: z.number().int().min(0).max(10080).optional().nullable(),
  done: z.boolean().optional(),
});

/**
 * PATCH /api/calendar/events/:id
 * Updates event fields or toggles done status (doneAt).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSessionContext();
  const userId = session.userId;
  if (!userId) {
    return apiError("UNAUTHORIZED", "Please sign in to update calendar events", 401);
  }

  const eventId = params.id;
  const existingEvent = await db.calendarEvent.findUnique({
    where: { id: eventId },
  });

  if (!existingEvent) {
    return apiError("NOT_FOUND", "Calendar event not found", 404);
  }

  if (existingEvent.userId !== userId) {
    return apiError("FORBIDDEN", "You do not have permission to edit this event", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = patchEventSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "Invalid update parameters",
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const updateData: any = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.startsAt !== undefined) updateData.startsAt = new Date(parsed.data.startsAt);
  if (parsed.data.endsAt !== undefined)
    updateData.endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
  if (parsed.data.timezone !== undefined) updateData.timezone = parsed.data.timezone;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.reminderMinutes !== undefined)
    updateData.reminderMinutes = parsed.data.reminderMinutes;
  if (parsed.data.done !== undefined) {
    updateData.doneAt = parsed.data.done ? new Date() : null;
  }

  const updatedEvent = await db.calendarEvent.update({
    where: { id: eventId },
    data: updateData,
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

  return apiSuccess({ event: updatedEvent });
}

/**
 * DELETE /api/calendar/events/:id
 * Removes a calendar event.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getSessionContext();
  const userId = session.userId;
  if (!userId) {
    return apiError("UNAUTHORIZED", "Please sign in to delete calendar events", 401);
  }

  const eventId = params.id;
  const existingEvent = await db.calendarEvent.findUnique({
    where: { id: eventId },
  });

  if (!existingEvent) {
    return apiError("NOT_FOUND", "Calendar event not found", 404);
  }

  if (existingEvent.userId !== userId) {
    return apiError("FORBIDDEN", "You do not have permission to delete this event", 403);
  }

  await db.calendarEvent.delete({
    where: { id: eventId },
  });

  return apiSuccess({ deleted: true, id: eventId });
}
