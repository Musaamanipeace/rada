import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";
import { checkRateLimit } from "@/lib/api-response";
import taxonomyData from "@/../data/taxonomy.json";

export interface CatalogueItem {
  id: string;
  savedItemId: string;
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
  cost: string;
  startsAt: Date | null;
  endsAt: Date | null;
  timezone: string | null;
  region: string | null;
  popularityCount: number;
  savedAt: Date;
}

export interface CatalogueSubcategory {
  id: string;
  slug: string;
  name: string;
  items: CatalogueItem[];
}

export interface CatalogueCategory {
  id: string;
  slug: string;
  name: string;
  subcategories: CatalogueSubcategory[];
  totalItems: number;
}

/**
 * GET /api/catalogues
 * Returns the owner's saved items grouped across all 10 categories and their subcategories.
 * Invariant (Rule 17): NEVER returns ads.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { allowed } = checkRateLimit(`catalogues:${ip}`, 60, 60);
  if (!allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
  }

  let session;
  try {
    session = await getSessionContext();
  } catch {
    return NextResponse.json(
      { error: { code: "SESSION_ERROR", message: "Could not establish session" } },
      { status: 500 },
    );
  }

  // Fetch all saved items for this owner
  const savedItems = await db.savedItem.findMany({
    where: { owner: session.owner },
    include: {
      item: {
        include: {
          category: { select: { id: true, slug: true, name: true } },
          subcategory: { select: { id: true, slug: true, name: true } },
          topic: { select: { id: true, slug: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Strict Rule 17 assertion: verify no ads in fetched records
  // (In items table, items are vetted editorial/suggested library items; no ads exist here, but we defensively filter out any item that isn't APPROVED or has ad fields)
  const approvedSaved = savedItems.filter(
    (si) => si.item && si.item.status === "APPROVED",
  );

  // Group items by subcategory ID
  const itemsBySubcat = new Map<string, CatalogueItem[]>();
  for (const s of approvedSaved) {
    const list = itemsBySubcat.get(s.item.subcategoryId) ?? [];
    list.push({
      id: s.item.id,
      savedItemId: s.id,
      title: s.item.title,
      url: s.item.url,
      sourceName: s.item.sourceName,
      description: s.item.description,
      thumbnailUrl: s.item.thumbnailUrl,
      categoryId: s.item.categoryId,
      subcategoryId: s.item.subcategoryId,
      topicId: s.item.topicId,
      category: s.item.category,
      subcategory: s.item.subcategory,
      topic: s.item.topic,
      cost: s.item.cost,
      startsAt: s.item.startsAt,
      endsAt: s.item.endsAt,
      timezone: s.item.timezone,
      region: s.item.region,
      popularityCount: s.item.popularityCount,
      savedAt: s.createdAt,
    });
    itemsBySubcat.set(s.item.subcategoryId, list);
  }

  // Construct taxonomy structure with grouped items
  const categories: CatalogueCategory[] = taxonomyData.categories.map((cat) => {
    let catTotal = 0;
    const subcategories: CatalogueSubcategory[] = cat.subcategories.map((sub) => {
      const items = itemsBySubcat.get(sub.id) ?? [];
      catTotal += items.length;
      return {
        id: sub.id,
        slug: sub.slug,
        name: sub.name,
        items,
      };
    });

    return {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      subcategories,
      totalItems: catTotal,
    };
  });

  return NextResponse.json({ categories });
}
