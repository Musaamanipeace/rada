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

const createSessionSchema = z.object({
  consent: z.literal(true, {
    errorMap: () => ({ message: "Explicit consent is required to participate" }),
  }),
  selectedCategories: z
    .array(z.string())
    .min(1, "Select at least one category")
    .max(10),
  // Honeypot spam trap: must be empty
  website: z.string().max(0, "Spam detected").optional().default(""),
});

export async function POST(req: NextRequest) {
  const sessionCtx = await getSessionContext();

  // Rate limit: 20 sessions per 10 minutes per owner/IP
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rateLimitKey = `survey_session_${sessionCtx.owner}_${ip}`;
  const { allowed } = checkRateLimit(rateLimitKey, 20, 600);
  if (!allowed) {
    return apiError("RATE_LIMIT_EXCEEDED", "Too many survey sessions started. Please slow down.", 429);
  }

  try {
    const rawBody = await req.json();
    const data = createSessionSchema.parse(rawBody);

    const session = await db.surveySession.create({
      data: {
        owner: sessionCtx.owner,
        consentAt: new Date(),
        claimedUserId: sessionCtx.userId,
      },
    });

    return apiSuccess({ sessionId: session.id }, 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return handleZodError(err);
    }
    return apiError("INTERNAL_ERROR", "Failed to start survey session", 500);
  }
}
