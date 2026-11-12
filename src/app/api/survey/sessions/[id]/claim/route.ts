import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { claimGuestSession, getSessionContext } from "@/lib/session";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  const authSession = await getServerSession(authOptions);
  const userId = (authSession?.user as any)?.id;

  if (!userId) {
    return apiError("UNAUTHORIZED", "Authentication required to claim session", 401);
  }

  const sessionCtx = await getSessionContext();

  const surveySession = await db.surveySession.findUnique({
    where: { id: sessionId },
  });

  if (!surveySession) {
    return apiError("NOT_FOUND", "Survey session not found", 404);
  }

  // Update survey session
  await db.surveySession.update({
    where: { id: sessionId },
    data: { claimedUserId: userId },
  });

  // Claim all guest session data
  await claimGuestSession(sessionCtx.anonToken, userId);

  return apiSuccess({ ok: true, claimedUserId: userId }, 200);
}
