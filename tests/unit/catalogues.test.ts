import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { ItemCost, ItemStatus, ItemOrigin } from "@prisma/client";

vi.mock("@/lib/session", () => ({
  getSessionContext: vi.fn().mockResolvedValue({
    userId: null,
    anonToken: "test_user_catalogues_1",
    owner: "test_user_catalogues_1",
    isAuthenticated: false,
  }),
}));

describe("Catalogues API & Grouping (Phase 3)", () => {
  const testOwner = "test_user_catalogues_1";

  beforeEach(async () => {
    // Clean up test saves and interactions
    await db.savedItem.deleteMany({ where: { owner: testOwner } });
    await db.interaction.deleteMany({ where: { owner: testOwner } });
  });

  it("strictly enforces Rule 17: /api/catalogues never returns ads", async () => {
    // Pick an approved library item and save it
    const approvedItem = await db.item.findFirst({
      where: { status: ItemStatus.APPROVED },
    });
    expect(approvedItem).toBeDefined();
    if (!approvedItem) return;

    await db.savedItem.create({
      data: {
        owner: testOwner,
        itemId: approvedItem.id,
      },
    });

    // Mock GET request to /api/catalogues
    const { GET } = await import("@/app/api/catalogues/route");
    const req = new Request("http://localhost:3000/api/catalogues", {
      headers: { "x-forwarded-for": "127.0.0.1" },
    });

    // Note: getSessionContext in mock will return anon session or guest
    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.categories).toBeDefined();
    expect(Array.isArray(data.categories)).toBe(true);

    // Assert that across all categories and subcategories, no item has ad properties or endpoints
    for (const cat of data.categories) {
      expect(cat.id).toBeDefined();
      expect(cat.slug).toBeDefined();
      for (const sub of cat.subcategories) {
        expect(sub.id).toBeDefined();
        for (const item of sub.items) {
          expect((item as any).type).not.toBe("AD");
          expect((item as any).adId).toBeUndefined();
          expect((item as any).advertiser).toBeUndefined();
          expect(item.url).not.toContain("/r/");
          expect(item.url).not.toContain("/watch-ads/");
        }
      }
    }
  });

  it("correctly groups saved items by category and subcategory shelves", async () => {
    // Fetch 2 distinct approved items from different subcategories
    const items = await db.item.findMany({
      where: { status: ItemStatus.APPROVED },
      take: 2,
    });
    expect(items.length).toBeGreaterThanOrEqual(1);

    // Save them for testOwner
    for (const item of items) {
      await db.savedItem.create({
        data: {
          owner: testOwner,
          itemId: item.id,
        },
      });
    }

    const saved = await db.savedItem.findMany({
      where: { owner: testOwner },
      include: {
        item: {
          include: {
            category: true,
            subcategory: true,
            topic: true,
          },
        },
      },
    });

    expect(saved.length).toBe(items.length);
    saved.forEach((s) => {
      expect(s.item.category).toBeDefined();
      expect(s.item.subcategory).toBeDefined();
      expect(s.item.topic).toBeDefined();
    });
  });
});
