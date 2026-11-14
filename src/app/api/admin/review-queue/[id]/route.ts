import { NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess, handleZodError } from "@/lib/api-response";

const reviewActionSchema = z.object({
  type: z.enum(["suggestion", "item"]),
  action: z.enum(["approve", "reject", "merge", "update_taxonomy"]),
  topicId: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  targetItemId: z.string().optional(),
  sourceName: z.string().optional().default("Curated"),
  cost: z.enum(["free", "paid", "unknown"]).optional().default("unknown"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const authSession = await getServerSession(authOptions);
  const userRole = (authSession?.user as any)?.role;
  const userId = (authSession?.user as any)?.id || null;
  const mockRoleHeader = req.headers.get("x-mock-role");

  const effectiveRole = userRole || (process.env.NODE_ENV !== "production" ? mockRoleHeader : null);

  if (effectiveRole !== "reviewer" && effectiveRole !== "admin") {
    return apiError("FORBIDDEN", "Reviewer or admin role required", 403);
  }

  try {
    const rawBody = await req.json();
    const data = reviewActionSchema.parse(rawBody);

    if (data.type === "suggestion") {
      const suggestion = await db.surveySuggestion.findUnique({
        where: { id },
        include: { subcategory: true },
      });

      if (!suggestion) {
        return apiError("NOT_FOUND", "Suggestion not found", 404);
      }

      if (data.action === "reject") {
        await db.surveySuggestion.update({
          where: { id },
          data: { status: "REJECTED" },
        });
        return apiSuccess({ ok: true, status: "rejected" }, 200);
      }

      if (data.action === "merge") {
        if (!data.targetItemId) {
          return apiError("VALIDATION_ERROR", "targetItemId is required to merge duplicate", 400);
        }

        const canonicalItem = await db.item.findUnique({
          where: { id: data.targetItemId },
        });

        if (!canonicalItem) {
          return apiError("NOT_FOUND", "Target canonical item not found", 404);
        }

        await db.$transaction([
          db.item.update({
            where: { id: data.targetItemId },
            data: { popularityCount: { increment: 1 } },
          }),
          db.surveySuggestion.update({
            where: { id },
            data: {
              status: "DUPLICATE",
              itemId: data.targetItemId,
            },
          }),
        ]);

        return apiSuccess({ ok: true, status: "duplicate", canonicalItemId: data.targetItemId }, 200);
      }

      if (data.action === "approve") {
        const topicId = data.topicId || suggestion.topicId;
        if (!topicId) {
          return apiError(
            "TOPIC_REQUIRED",
            "Every approved item must have a valid topic (D2, Rule 5)",
            400
          );
        }

        // Verify topic belongs to subcategory
        const topic = await db.topic.findUnique({
          where: { id: topicId },
        });

        if (!topic || topic.parentId !== suggestion.subcategoryId) {
          return apiError(
            "INVALID_TOPIC",
            "Topic does not belong to the subcategory",
            400
          );
        }

        const categoryId = suggestion.subcategory.parentId;

        // Create approved item and link suggestion
        const createdItem = await db.$transaction(async (tx) => {
          const item = await tx.item.create({
            data: {
              title: suggestion.title,
              url: suggestion.url,
              sourceName: data.sourceName,
              description: suggestion.note || undefined,
              categoryId,
              subcategoryId: suggestion.subcategoryId,
              topicId,
              cost: data.cost === "free" ? "FREE" : data.cost === "paid" ? "PAID" : "UNKNOWN",
              status: "APPROVED",
              origin: "SURVEY",
              reviewedById: userId,
            },
          });

          await tx.surveySuggestion.update({
            where: { id },
            data: {
              status: "APPROVED",
              topicId,
              itemId: item.id,
            },
          });

          return item;
        });

        return apiSuccess({ ok: true, status: "approved", item: createdItem }, 200);
      }
    }

    if (data.type === "item") {
      const item = await db.item.findUnique({
        where: { id },
      });

      if (!item) {
        return apiError("NOT_FOUND", "Item not found", 404);
      }

      if (data.action === "reject") {
        await db.item.update({
          where: { id },
          data: { status: "REJECTED", reviewedById: userId },
        });
        return apiSuccess({ ok: true, status: "rejected" }, 200);
      }

      if (data.action === "merge") {
        if (!data.targetItemId || data.targetItemId === id) {
          return apiError("VALIDATION_ERROR", "Valid distinct targetItemId required to merge", 400);
        }

        await db.$transaction([
          db.item.update({
            where: { id: data.targetItemId },
            data: { popularityCount: { increment: 1 } },
          }),
          db.item.update({
            where: { id },
            data: { status: "DUPLICATE", reviewedById: userId },
          }),
        ]);

        return apiSuccess({ ok: true, status: "duplicate" }, 200);
      }

      if (data.action === "approve") {
        await db.item.update({
          where: { id },
          data: { status: "APPROVED", reviewedById: userId },
        });
        return apiSuccess({ ok: true, status: "approved" }, 200);
      }
    }

    return apiError("INVALID_ACTION", "Unrecognized review action", 400);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return handleZodError(err);
    }
    console.error("Review action failed:", err);
    return apiError("INTERNAL_ERROR", "Review action failed", 500);
  }
}
