import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import {
  apiError,
  apiSuccess,
  handleZodError,
  checkRateLimit,
} from "@/lib/api-response";

const normalizeUrl = (raw: string) => {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  return u;
};

const suggestionItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .transform(normalizeUrl)
    .refine((val) => {
      try {
        const parsed = new URL(val);
        return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
      } catch {
        return false;
      }
    }, "A valid web link (http or https) is required"),
  pickType: z.enum(["useful", "impactful", "favorite"], {
    errorMap: () => ({ message: "Pick type must be 'useful', 'impactful', or 'favorite'" }),
  }),
  topicId: z.string().trim().optional().nullable(),
  note: z.string().trim().max(140, "Note must be at most 140 characters").optional().nullable(),
});

const putSuggestionsSchema = z.object({
  subcategoryId: z.string().min(1, "Subcategory ID is required"),
  suggestions: z.array(suggestionItemSchema).max(5, "At most 5 suggestions per subcategory"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  const sessionCtx = await getSessionContext();

  // Rate limit: 60 suggestion saves per minute
  const rateLimitKey = `survey_put_${sessionId}`;
  const { allowed } = checkRateLimit(rateLimitKey, 60, 60);
  if (!allowed) {
    return apiError("RATE_LIMIT_EXCEEDED", "Too many requests. Please wait a moment.", 429);
  }

  // Verify survey session exists and belongs to this owner
  const session = await db.surveySession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return apiError("NOT_FOUND", "Survey session not found", 404);
  }

  if (session.owner !== sessionCtx.owner && session.claimedUserId !== sessionCtx.userId) {
    return apiError("FORBIDDEN", "You do not own this survey session", 403);
  }

  if (session.finishedAt) {
    return apiError("SESSION_FINISHED", "This survey session has already been completed", 400);
  }

  try {
    const rawBody = await req.json();
    const data = putSuggestionsSchema.parse(rawBody);

    // Verify subcategory exists
    const subcategory = await db.subcategory.findUnique({
      where: { id: data.subcategoryId },
      include: { topics: true },
    });

    if (!subcategory) {
      return apiError(
        "INVALID_SUBCATEGORY",
        `Subcategory '${data.subcategoryId}' not found in taxonomy`,
        400,
        { subcategoryId: ["Invalid subcategory ID"] }
      );
    }

    const validTopicIds = new Set(subcategory.topics.map((t) => t.id));

    // Verify all provided topicIds belong to this subcategory
    for (const sugg of data.suggestions) {
      if (sugg.topicId && !validTopicIds.has(sugg.topicId)) {
        return apiError(
          "INVALID_TOPIC",
          `Topic '${sugg.topicId}' does not belong to subcategory '${subcategory.id}'`,
          400,
          { topicId: [`Topic does not belong to ${subcategory.name}`] }
        );
      }
    }

    // Atomic update of suggestions for this subcategory
    await db.$transaction(async (tx) => {
      await tx.surveySuggestion.deleteMany({
        where: {
          sessionId,
          subcategoryId: data.subcategoryId,
        },
      });

      if (data.suggestions.length > 0) {
        await tx.surveySuggestion.createMany({
          data: data.suggestions.map((sugg) => ({
            sessionId,
            subcategoryId: data.subcategoryId,
            topicId: sugg.topicId || null,
            title: sugg.title,
            url: sugg.url,
            pickType: sugg.pickType === "useful" ? "USEFUL" : sugg.pickType === "impactful" ? "IMPACTFUL" : "FAVORITE",
            note: sugg.note || null,
            status: "PENDING",
          })),
        });
      }
    });

    return apiSuccess({ ok: true, savedCount: data.suggestions.length }, 200);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return handleZodError(err);
    }
    console.error("Failed to save survey suggestions:", err);
    return apiError("INTERNAL_ERROR", "Failed to save suggestions", 500);
  }
}
