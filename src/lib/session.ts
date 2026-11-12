import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const ANON_COOKIE_NAME = "rada_anon_token";

export interface SessionContext {
  userId: string | null;
  anonToken: string;
  owner: string; // userId if authenticated, otherwise anonToken
  isAuthenticated: boolean;
}

export async function getOrCreateAnonToken(): Promise<string> {
  const cookieStore = cookies();
  const existingToken = cookieStore.get(ANON_COOKIE_NAME)?.value;

  if (existingToken) {
    const session = await db.anonSession.findUnique({
      where: { token: existingToken },
    });
    if (session) {
      return session.token;
    }
  }

  // Create new anon session
  const newToken = `anon_${randomUUID().replace(/-/g, "")}`;
  await db.anonSession.create({
    data: {
      token: newToken,
    },
  });

  return newToken;
}

export async function getSessionContext(): Promise<SessionContext> {
  const authSession = await getServerSession(authOptions);
  const userId = (authSession?.user as any)?.id ?? null;
  const anonToken = await getOrCreateAnonToken();

  return {
    userId,
    anonToken,
    owner: userId || anonToken,
    isAuthenticated: !!userId,
  };
}

/**
 * Claim and migrate guest records to a logged-in user account
 */
export async function claimGuestSession(anonToken: string, userId: string): Promise<void> {
  if (!anonToken || !userId || anonToken === userId) return;

  await db.$transaction(async (tx) => {
    // 1. Migrate saved items (avoid duplicates with upsert/ignore)
    const guestSaves = await tx.savedItem.findMany({
      where: { owner: anonToken },
    });
    for (const save of guestSaves) {
      await tx.savedItem.upsert({
        where: {
          owner_itemId: {
            owner: userId,
            itemId: save.itemId,
          },
        },
        create: {
          owner: userId,
          itemId: save.itemId,
          createdAt: save.createdAt,
        },
        update: {},
      });
    }
    await tx.savedItem.deleteMany({ where: { owner: anonToken } });

    // 2. Migrate interests (avoid duplicate subcategories)
    const guestInterests = await tx.userInterest.findMany({
      where: { owner: anonToken },
    });
    for (const interest of guestInterests) {
      await tx.userInterest.upsert({
        where: {
          owner_subcategoryId: {
            owner: userId,
            subcategoryId: interest.subcategoryId,
          },
        },
        create: {
          owner: userId,
          subcategoryId: interest.subcategoryId,
          weight: interest.weight,
        },
        update: {},
      });
    }
    await tx.userInterest.deleteMany({ where: { owner: anonToken } });

    // 3. Migrate interactions
    await tx.interaction.updateMany({
      where: { owner: anonToken },
      data: { owner: userId },
    });

    // 4. Link survey sessions
    await tx.surveySession.updateMany({
      where: { owner: anonToken },
      data: { claimedUserId: userId },
    });

    // 5. Delete claimed anon session
    await tx.anonSession.deleteMany({
      where: { token: anonToken },
    });
  });
}
