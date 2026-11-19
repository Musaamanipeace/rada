import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { apiError } from "@/lib/api-response";

const paramsSchema = z.object({ id: z.string().min(1) });

/**
 * POST /api/items/:id/save
 * Saves an item to the owner's My Catalogues and records a 'save' interaction.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const paramsResult = paramsSchema.safeParse(params);
  if (!paramsResult.success) {
    return apiError("VALIDATION_ERROR", "Invalid item ID", 400);
  }

  const session = await getSessionContext();
  const { id: itemId } = paramsResult.data;

  // Verify item exists and is approved
  const item = await db.item.findUnique({ where: { id: itemId }, select: { id: true, status: true } });
  if (!item || item.status !== "APPROVED") {
    return apiError("NOT_FOUND", "Item not found", 404);
  }

  await db.$transaction(async (tx) => {
    await tx.savedItem.upsert({
      where: { owner_itemId: { owner: session.owner, itemId } },
      create: { owner: session.owner, itemId },
      update: {},
    });
    await tx.interaction.create({
      data: { owner: session.owner, itemId, type: "SAVE" },
    });
  });

  return NextResponse.json({ saved: true, itemId });
}

/**
 * DELETE /api/items/:id/save
 * Removes an item from saved_items and records an 'unsave' interaction.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const paramsResult = paramsSchema.safeParse(params);
  if (!paramsResult.success) {
    return apiError("VALIDATION_ERROR", "Invalid item ID", 400);
  }

  const session = await getSessionContext();
  const { id: itemId } = paramsResult.data;

  await db.$transaction(async (tx) => {
    await tx.savedItem.deleteMany({
      where: { owner: session.owner, itemId },
    });
    await tx.interaction.create({
      data: { owner: session.owner, itemId, type: "UNSAVE" },
    });
  });

  return NextResponse.json({ saved: false, itemId });
}
