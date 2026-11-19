import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { apiError, apiSuccess } from "@/lib/api-response";

/**
 * GET /api/me/data
 * Exports all user account data, interests, interactions, saved items,
 * calendar events, survey sessions, and portfolio in machine-readable JSON format.
 * Requirement: Section 7, Section 9 (User Data Rights).
 */
export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  const userId = session.userId;

  if (!userId) {
    return apiError("UNAUTHORIZED", "Please sign in to export your data", 401);
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      image: true,
      role: true,
      region: true,
      thumbnailsHidden: true,
      createdAt: true,
    },
  });

  if (!user) {
    return apiError("NOT_FOUND", "User record not found", 404);
  }

  // 1. Interests
  const interests = await db.userInterest.findMany({
    where: { owner: userId },
    include: {
      subcategory: {
        select: { id: true, slug: true, name: true },
      },
    },
  });

  // 2. Saved Items
  const savedItems = await db.savedItem.findMany({
    where: { owner: userId },
    include: {
      item: {
        select: {
          id: true,
          title: true,
          url: true,
          sourceName: true,
          cost: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  });

  // 3. In-app interactions
  const interactions = await db.interaction.findMany({
    where: { owner: userId },
    select: {
      id: true,
      itemId: true,
      type: true,
      createdAt: true,
    },
  });

  // 4. Calendar Events
  const calendarEvents = await db.calendarEvent.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      timezone: true,
      notes: true,
      sourceItemId: true,
      reminderMinutes: true,
      doneAt: true,
      createdAt: true,
    },
  });

  // 5. Survey sessions
  const surveySessions = await db.surveySession.findMany({
    where: {
      OR: [{ owner: userId }, { claimedUserId: userId }],
    },
    include: {
      suggestions: {
        select: {
          id: true,
          title: true,
          url: true,
          pickType: true,
          note: true,
          status: true,
        },
      },
    },
  });

  // 6. Portfolio
  const portfolio = await db.portfolio.findUnique({
    where: { userId },
  });

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    profile: user,
    interests: interests.map((i) => ({
      subcategoryId: i.subcategoryId,
      subcategoryName: i.subcategory.name,
      subcategorySlug: i.subcategory.slug,
      weight: i.weight,
      createdAt: i.createdAt,
    })),
    savedItems: savedItems.map((s) => ({
      savedItemId: s.id,
      itemId: s.itemId,
      title: s.item?.title,
      url: s.item?.url,
      sourceName: s.item?.sourceName,
      cost: s.item?.cost,
      savedAt: s.createdAt,
    })),
    interactions,
    calendarEvents,
    surveySessions,
    portfolio,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rada-user-data.json"',
    },
  });
}

/**
 * DELETE /api/me/data
 * Permanently deletes all records associated with the user account,
 * including interactions, saved items, calendar events, interests,
 * portfolio, survey sessions, and the user profile itself.
 */
export async function DELETE(request: NextRequest) {
  const session = await getSessionContext();
  const userId = session.userId;

  if (!userId) {
    return apiError("UNAUTHORIZED", "Please sign in to delete your data", 401);
  }

  await db.$transaction(async (tx) => {
    // 1. Delete saved items
    await tx.savedItem.deleteMany({ where: { owner: userId } });

    // 2. Delete interests
    await tx.userInterest.deleteMany({ where: { owner: userId } });

    // 3. Delete interactions
    await tx.interaction.deleteMany({ where: { owner: userId } });

    // 4. Delete calendar events
    await tx.calendarEvent.deleteMany({ where: { userId } });

    // 5. Delete portfolio
    await tx.portfolio.deleteMany({ where: { userId } });

    // 6. Delete survey sessions
    await tx.surveySession.deleteMany({
      where: {
        OR: [{ owner: userId }, { claimedUserId: userId }],
      },
    });

    // 7. Write audit log entry (Rule 11/19 compliant)
    await tx.auditLog.create({
      data: {
        actor: userId,
        action: "USER_DATA_DELETED",
        target: userId,
      },
    });

    // 8. Delete user record
    await tx.user.delete({ where: { id: userId } });
  });

  return apiSuccess({ deleted: true, userId });
}
