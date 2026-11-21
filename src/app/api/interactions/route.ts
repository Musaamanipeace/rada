import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { apiError } from "@/lib/api-response";

const interactionBodySchema = z.object({
  itemId: z.string().min(1),
  type: z.enum(["open", "calendar_add"]),
});

/**
 * POST /api/interactions
 * Records an in-app interaction (open, calendar_add) in the interactions table.
 * Does NOT handle save/unsave/dismiss — those have their own endpoints.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = interactionBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid interaction", 400, parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const session = await getSessionContext();
  const { itemId, type } = parsed.data;

  const item = await db.item.findUnique({ where: { id: itemId }, select: { id: true } });
  if (!item) {
    return apiError("NOT_FOUND", "Item not found", 404);
  }

  const prismaType = type === "open" ? "OPEN" : "CALENDAR_ADD";

  await db.interaction.create({
    data: { owner: session.owner, itemId, type: prismaType },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
