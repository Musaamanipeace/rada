import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionContext } from "@/lib/session";
import { getDiscoveryFeed } from "@/lib/ranking/engine";
import { checkRateLimit } from "@/lib/api-response";

const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(20),
  categories: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : undefined)),
  subcategory: z.string().optional(),
  topic: z.string().optional(),
  mode: z.literal("variety").optional(),
  cost: z.enum(["free", "paid"]).optional(),
  upcoming: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  local: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  seen: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean) : [])),
});

/**
 * GET /api/feed
 * Returns a cursor-paginated batch of approved discovery items.
 * Invariant (Rule 17): NEVER returns ads.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(`feed:${ip}`, 60, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawParams = Object.fromEntries(searchParams.entries());

  const parsed = feedQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const { cursor, limit, categories, subcategory, topic, mode, cost, upcoming, local, seen } =
    parsed.data;

  let session;
  try {
    session = await getSessionContext();
  } catch {
    return NextResponse.json(
      { error: { code: "SESSION_ERROR", message: "Could not establish session" } },
      { status: 500 },
    );
  }

  // Fetch user region for Local filter
  let userRegion: string | null = null;
  if (local && session.isAuthenticated && session.userId) {
    const { db } = await import("@/lib/db");
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { region: true },
    });
    userRegion = user?.region ?? null;
  }

  const feedResult = await getDiscoveryFeed({
    owner: session.owner,
    cursor,
    limit,
    categories,
    subcategory,
    topic,
    varietyMode: mode === "variety",
    cost,
    upcoming,
    local,
    userRegion,
    sessionSeenIds: seen,
  });

  return NextResponse.json({
    items: feedResult.items,
    nextCursor: feedResult.nextCursor,
    recycled: feedResult.recycled,
  });
}
