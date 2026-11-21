import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { apiError } from "@/lib/api-response";

const interestBodySchema = z.object({
  subcategoryIds: z
    .array(z.string().min(1))
    .min(3, "Please select at least 3 interests")
    .max(34, "Too many interests"),
});

/**
 * GET /api/me/interests
 * Returns the owner's stated subcategory interests.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionContext();

  const interests = await db.userInterest.findMany({
    where: { owner: session.owner },
    include: {
      subcategory: {
        select: { id: true, slug: true, name: true, parentId: true },
      },
    },
    orderBy: { weight: "desc" },
  });

  return NextResponse.json({ interests });
}

/**
 * PUT /api/me/interests
 * Sets the owner's stated interests (replaces all existing; at least 3 subcategories).
 */
export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON body", 400);
  }

  const parsed = interestBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid interests", 400, parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const session = await getSessionContext();
  const { subcategoryIds } = parsed.data;

  // Verify all subcategory IDs exist
  const existing = await db.subcategory.findMany({
    where: { id: { in: subcategoryIds } },
    select: { id: true },
  });
  if (existing.length !== subcategoryIds.length) {
    return apiError("VALIDATION_ERROR", "One or more subcategory IDs are invalid", 400);
  }

  await db.$transaction(async (tx) => {
    // Replace all interests atomically
    await tx.userInterest.deleteMany({ where: { owner: session.owner } });
    await tx.userInterest.createMany({
      data: subcategoryIds.map((subcategoryId) => ({
        owner: session.owner,
        subcategoryId,
        weight: 1.0,
      })),
    });
  });

  return NextResponse.json({ interests: subcategoryIds });
}
