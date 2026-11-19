import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { apiError } from "@/lib/api-response";

const paramsSchema = z.object({ id: z.string().min(1) });

/**
 * POST /api/items/:id/dismiss
 * Marks an item as "Not interested" (permanent exclusion for this owner).
 * Records a 'dismiss' interaction (−3 signal).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const paramsResult = paramsSchema.safeParse(params);
  if (!paramsResult.success) {
    return apiError("VALIDATION_ERROR", "Invalid item ID", 400);
  }

  const session = await getSessionContext();
  const { id: itemId } = paramsResult.data;

  const item = await db.item.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) {
    return apiError("NOT_FOUND", "Item not found", 404);
  }

  // Idempotent: only create if not already dismissed
  const existing = await db.interaction.findFirst({
    where: { owner: session.owner, itemId, type: "DISMISS" },
  });

  if (!existing) {
    await db.interaction.create({
      data: { owner: session.owner, itemId, type: "DISMISS" },
    });
  }

  return NextResponse.json({ dismissed: true, itemId });
}
