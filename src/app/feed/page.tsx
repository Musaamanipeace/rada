import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { DiscoveryFeed } from "@/features/feed/DiscoveryFeed";

export const metadata = {
  title: "Discover — Rada",
  description: "Discover articles, podcasts, courses, videos, books, games, and local activities personalised to your interests.",
};

export default async function FeedPage() {
  const authSession = await getServerSession(authOptions);
  const isAuthenticated = !!authSession?.user;

  // Server-side: check whether the user has stated interests
  let hasInterests = false;
  try {
    const session = await getSessionContext();
    const count = await db.userInterest.count({ where: { owner: session.owner } });
    hasInterests = count >= 3;
  } catch {
    // Session errors default to no interests → onboarding modal shown
    hasInterests = false;
  }

  return (
    <DiscoveryFeed
      hasInterests={hasInterests}
      isAuthenticated={isAuthenticated}
    />
  );
}
