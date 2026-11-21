import { db } from "@/lib/db";
import { RANKING_V1_WEIGHTS } from "@/lib/ranking/weights";
import { ItemCost, ItemStatus } from "@prisma/client";

export interface FeedQueryParams {
  owner: string;
  cursor?: string;
  limit?: number;
  categories?: string[]; // category slugs
  subcategory?: string; // subcategory slug
  topic?: string; // topic slug
  varietyMode?: boolean;
  cost?: "free" | "paid";
  upcoming?: boolean;
  local?: boolean;
  userRegion?: string | null;
  sessionSeenIds?: string[];
}

export interface ScoredFeedItem {
  id: string;
  title: string;
  url: string;
  sourceName: string;
  description: string | null;
  thumbnailUrl: string | null;
  categoryId: string;
  subcategoryId: string;
  topicId: string;
  category: { id: string; slug: string; name: string };
  subcategory: { id: string; slug: string; name: string };
  topic: { id: string; slug: string; name: string };
  cost: ItemCost;
  startsAt: Date | null;
  endsAt: Date | null;
  timezone: string | null;
  region: string | null;
  popularityCount: number;
  isSaved?: boolean;
  score?: number;
}

export interface FeedResult {
  items: ScoredFeedItem[];
  nextCursor: string | null;
  recycled: boolean;
  totalAvailable: number;
}

/**
 * Computes decay multiplier for interaction signals based on age in days.
 * 30-day linear/half-life decay.
 */
function computeDecayMultiplier(createdAt: Date, decayDays = RANKING_V1_WEIGHTS.interactions.decayDays): number {
  const ageInMs = Date.now() - createdAt.getTime();
  const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
  if (ageInDays >= decayDays) return 0;
  return Math.max(0, 1 - ageInDays / decayDays);
}

/**
 * Core Ranking and Filtering Engine for Discovery Feed
 * Implements Section 9 & 8.1 of Rada Build Plan.
 */
export async function getDiscoveryFeed(params: FeedQueryParams): Promise<FeedResult> {
  const {
    owner,
    cursor,
    limit = RANKING_V1_WEIGHTS.batch.defaultLimit,
    categories,
    subcategory,
    topic,
    varietyMode = false,
    cost,
    upcoming = false,
    local = false,
    userRegion = null,
    sessionSeenIds = [],
  } = params;

  const now = new Date();

  // 1. Fetch user stated interests (subcategories)
  const userInterests = await db.userInterest.findMany({
    where: { owner },
    select: { subcategoryId: true, weight: true },
  });
  const interestedSubcategoryMap = new Map<string, number>();
  userInterests.forEach((ui) => {
    interestedSubcategoryMap.set(ui.subcategoryId, ui.weight);
  });

  // 2. Fetch user interactions within decay window (last 30 days)
  const decayCutoff = new Date(Date.now() - RANKING_V1_WEIGHTS.interactions.decayDays * 24 * 60 * 60 * 1000);
  const recentInteractions = await db.interaction.findMany({
    where: {
      owner,
      createdAt: { gte: decayCutoff },
    },
    select: {
      itemId: true,
      type: true,
      createdAt: true,
    },
  });

  // Group interaction scores by item
  const itemInteractionScoreMap = new Map<string, number>();
  for (const interaction of recentInteractions) {
    const decay = computeDecayMultiplier(interaction.createdAt);
    let weight = 0;
    switch (interaction.type) {
      case "SAVE":
        weight = RANKING_V1_WEIGHTS.interactions.save;
        break;
      case "CALENDAR_ADD":
        weight = RANKING_V1_WEIGHTS.interactions.calendar_add;
        break;
      case "OPEN":
        weight = RANKING_V1_WEIGHTS.interactions.open;
        break;
      case "DISMISS":
        weight = RANKING_V1_WEIGHTS.interactions.dismiss;
        break;
      default:
        weight = 0;
    }
    const currentScore = itemInteractionScoreMap.get(interaction.itemId) ?? 0;
    itemInteractionScoreMap.set(interaction.itemId, currentScore + weight * decay);
  }

  // 3. Exclusions:
  // a) Items ever dismissed by this user
  const allDismissed = await db.interaction.findMany({
    where: {
      owner,
      type: "DISMISS",
    },
    select: { itemId: true },
  });
  const dismissedItemIds = new Set(allDismissed.map((d) => d.itemId));

  // b) Items currently saved by this user
  const allSaved = await db.savedItem.findMany({
    where: { owner },
    select: { itemId: true },
  });
  const savedItemIds = new Set(allSaved.map((s) => s.itemId));

  // c) Session seen items
  const sessionSeenSet = new Set(sessionSeenIds);

  // 4. Build database WHERE clause
  const where: any = {
    status: ItemStatus.APPROVED,
    // Exclude past-dated items: either startsAt is null OR endsAt/startsAt >= now
    OR: [
      { startsAt: null },
      { endsAt: { gte: now } },
      { endsAt: null, startsAt: { gte: now } },
    ],
  };

  // Cost filter: D28 & D13
  if (cost === "free") {
    where.cost = ItemCost.FREE;
  } else if (cost === "paid") {
    where.cost = ItemCost.PAID;
  }

  // Upcoming filter: items with future startsAt
  if (upcoming) {
    where.startsAt = { gt: now };
  }

  // Local filter: match user region
  if (local && userRegion) {
    where.region = userRegion;
  }

  // Taxonomy filters
  if (topic) {
    where.topic = { slug: topic };
  } else if (subcategory) {
    where.subcategory = { slug: subcategory };
  } else if (categories && categories.length > 0) {
    where.category = { slug: { in: categories } };
  }

  // 5. Query candidate approved items
  const candidateItems = await db.item.findMany({
    where,
    include: {
      category: { select: { id: true, slug: true, name: true } },
      subcategory: { select: { id: true, slug: true, name: true } },
      topic: { select: { id: true, slug: true, name: true } },
    },
  });

  // 6. Filter out exclusions
  const activeUnseenItems: typeof candidateItems = [];
  const recyclableItems: typeof candidateItems = [];

  for (const item of candidateItems) {
    // Permanent exclusions: dismissed items
    if (dismissedItemIds.has(item.id)) {
      continue;
    }
    // Feed exclusion: already saved items
    if (savedItemIds.has(item.id)) {
      continue;
    }

    // Check if seen in this session
    if (sessionSeenSet.has(item.id)) {
      recyclableItems.push(item);
    } else {
      activeUnseenItems.push(item);
    }
  }

  let itemsToScore: typeof candidateItems = [];
  let isRecycled = false;

  if (activeUnseenItems.length > 0) {
    itemsToScore = activeUnseenItems;
  } else if (recyclableItems.length > 0) {
    // Exhaustion recycling: when fresh items run out, recycle unsaved, non-dismissed items
    itemsToScore = recyclableItems;
    isRecycled = true;
  } else {
    return {
      items: [],
      nextCursor: null,
      recycled: false,
      totalAvailable: 0,
    };
  }

  // 7. Score items
  // Scoring formula:
  // Base = interestMatch + interactionScore + popularityScore + freshnessScore
  const hasStatedInterests = interestedSubcategoryMap.size > 0;
  const isVariety = varietyMode || !hasStatedInterests;

  const scoredItems = itemsToScore.map((item) => {
    let score = 0;

    if (!isVariety && hasStatedInterests) {
      // Interest match: topic 1.0, subcategory 0.7, category 0.4
      const subcatWeight = interestedSubcategoryMap.get(item.subcategoryId) ?? 0;
      if (subcatWeight > 0) {
        score += RANKING_V1_WEIGHTS.interestMatch.subcategory * subcatWeight;
        // Check topic match bonus if topic is subcategory's specific topic
        if (!item.topic.slug.endsWith("-general")) {
          score += RANKING_V1_WEIGHTS.interestMatch.topic;
        }
      }
    } else {
      // Variety mode: balance across categories
      score += 1.0;
    }

    // Interactions score
    const interactionScore = itemInteractionScoreMap.get(item.id) ?? 0;
    score += interactionScore;

    // Popularity boost: logarithmic dampening
    score += Math.log10(Math.max(1, item.popularityCount)) * 0.5;

    // Upcoming freshness boost: if startsAt is in the next 14 days, grant freshness boost
    if (item.startsAt && item.startsAt > now) {
      const daysUntil = (item.startsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntil <= 14) {
        score += Math.max(0, 1.5 - (daysUntil / 14) * 0.5);
      }
    }

    return {
      item,
      score,
      inInterests: interestedSubcategoryMap.has(item.subcategoryId),
    };
  });

  // Sort descending by score, with deterministic tie-breaker (id)
  scoredItems.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.item.id.localeCompare(b.item.id);
  });

  // 8. Exploration quota:
  // In normal mode (not explicit category filter and not variety mode),
  // reserve ~15% (e.g. 3 out of 20) for items outside the user's stated interests.
  let selectedItems: typeof scoredItems = [];

  const shouldApplyExploration =
    !isVariety &&
    hasStatedInterests &&
    !categories &&
    !subcategory &&
    !topic;

  if (shouldApplyExploration && scoredItems.length > 5) {
    const explorationCount = Math.max(1, Math.round(limit * RANKING_V1_WEIGHTS.batch.outsideInterestsExplorationRatio));
    const targetInsideCount = limit - explorationCount;

    const insideItems = scoredItems.filter((s) => s.inInterests);
    const outsideItems = scoredItems.filter((s) => !s.inInterests);

    const pickedInside = insideItems.slice(0, targetInsideCount);
    const pickedOutside = outsideItems.slice(0, explorationCount);

    // Interleave exploration items
    const combined = [...pickedInside];
    if (pickedOutside.length > 0) {
      // Insert exploration items evenly
      pickedOutside.forEach((item, idx) => {
        const insertPos = Math.min(combined.length, (idx + 1) * 5);
        combined.splice(insertPos, 0, item);
      });
    }

    // If we didn't fill the batch, top up with remaining
    if (combined.length < limit) {
      const remainingInside = insideItems.slice(targetInsideCount);
      const remainingOutside = outsideItems.slice(explorationCount);
      const remaining = [...remainingInside, ...remainingOutside];
      for (const rem of remaining) {
        if (combined.length >= limit) break;
        if (!combined.some((c) => c.item.id === rem.item.id)) {
          combined.push(rem);
        }
      }
    }

    selectedItems = combined.slice(0, limit);
  } else {
    // Cursor offset pagination if cursor is provided
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = scoredItems.findIndex((s) => s.item.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }
    selectedItems = scoredItems.slice(startIndex, startIndex + limit);
  }

  // 9. Format output items
  const resultItems: ScoredFeedItem[] = selectedItems.map(({ item, score }) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    sourceName: item.sourceName,
    description: item.description,
    thumbnailUrl: item.thumbnailUrl,
    categoryId: item.categoryId,
    subcategoryId: item.subcategoryId,
    topicId: item.topicId,
    category: item.category,
    subcategory: item.subcategory,
    topic: item.topic,
    cost: item.cost,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    timezone: item.timezone,
    region: item.region,
    popularityCount: item.popularityCount,
    isSaved: false,
    score,
  }));

  const lastItem = resultItems[resultItems.length - 1];
  const nextCursor = lastItem ? lastItem.id : null;

  return {
    items: resultItems,
    nextCursor,
    recycled: isRecycled,
    totalAvailable: scoredItems.length,
  };
}
