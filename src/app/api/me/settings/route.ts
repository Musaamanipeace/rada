import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/api-response";

const settingsPatchSchema = z.object({
  thumbnailsHidden: z.boolean().optional(),
  region: z.string().max(10).nullable().optional(),
});

/**
 * GET /api/me/settings
 * Returns persisted user preferences (thumbnails_hidden, region).
 * Guests receive null (UI falls back to localStorage).
 */
export async function GET(request: NextRequest) {
  const authSession = await getServerSession(authOptions);
  const userId = (authSession?.user as any)?.id ?? null;

  if (!userId) {
    // Not authenticated — no server-side settings for guests
    return apiSuccess({ settings: null });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { thumbnailsHidden: true, region: true },
  });

  return apiSuccess({ settings: user });
}

/**
 * PATCH /api/me/settings
 * Updates thumbnails_hidden and/or region for authenticated users.
 * Guests are silently ignored (preferences live in localStorage only).
 */
export async function PATCH(request: NextRequest) {
  const authSession = await getServerSession(authOptions);
  const userId = (authSession?.user as any)?.id ?? null;

  if (!userId) {
    // Guest: nothing to persist server-side
    return apiSuccess({ settings: null });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Invalid JSON body"), { status: 400 });
  }

  const parsed = settingsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Invalid settings", 400, parsed.error.flatten().fieldErrors as Record<string, string[]>),
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.thumbnailsHidden !== undefined) {
    update.thumbnailsHidden = parsed.data.thumbnailsHidden;
  }
  if (parsed.data.region !== undefined) {
    update.region = parsed.data.region;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No settings to update"), { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: update,
    select: { thumbnailsHidden: true, region: true },
  });

  return apiSuccess({ settings: updated });
}
