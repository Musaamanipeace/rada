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

const finishSurveySchema = z.object({
  action: z.enum(["keep", "delete"], {
    errorMap: () => ({ message: "Action must be 'keep' or 'delete'" }),
  }),
  email: z.string().email("Invalid email format").optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  const sessionCtx = await getSessionContext();

  const rateLimitKey = `survey_finish_${sessionId}`;
  const { allowed } = checkRateLimit(rateLimitKey, 10, 60);
  if (!allowed) {
    return apiError("RATE_LIMIT_EXCEEDED", "Too many requests. Please wait a moment.", 429);
  }

  const session = await db.surveySession.findUnique({
    where: { id: sessionId },
    include: { suggestions: true },
  });

  if (!session) {
    return apiError("NOT_FOUND", "Survey session not found", 404);
  }

  if (session.owner !== sessionCtx.owner && session.claimedUserId !== sessionCtx.userId) {
    return apiError("FORBIDDEN", "You do not own this survey session", 403);
  }

  try {
    const rawBody = await req.json();
    const data = finishSurveySchema.parse(rawBody);

    if (data.action === "delete") {
      await db.surveySession.delete({
        where: { id: sessionId },
      });
      return apiSuccess({ ok: true, action: "delete" }, 200);
    }

    // Action: "keep" (anonymous retention per O8 or associated with email/user)
    if (data.email) {
      // Check if user exists or link to user
      const user = await db.user.findUnique({
        where: { email: data.email },
      });
      if (user) {
        // Enforce one response per email
        const existingFinished = await db.surveySession.findFirst({
          where: {
            claimedUserId: user.id,
            finishedAt: { not: null },
            id: { not: sessionId },
          },
        });

        if (existingFinished) {
          return apiError(
            "DUPLICATE_RESPONSE",
            "A survey submission has already been recorded for this email address.",
            409
          );
        }

        await db.surveySession.update({
          where: { id: sessionId },
          data: {
            claimedUserId: user.id,
            finishedAt: new Date(),
          },
        });
        return apiSuccess({ ok: true, action: "keep", claimed: true }, 200);
      }
    }

    await db.surveySession.update({
      where: { id: sessionId },
      data: {
        finishedAt: new Date(),
      },
    });

    return apiSuccess({ ok: true, action: "keep", claimed: false }, 200);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return handleZodError(err);
    }
    console.error("Failed to finish survey session:", err);
    return apiError("INTERNAL_ERROR", "Failed to finish survey session", 500);
  }
}
