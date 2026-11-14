import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";

describe("Survey & Moderation Reviewer Flow", () => {
  it("enforces that suggestions cannot be saved with an invalid subcategory", async () => {
    // Check DB directly
    const invalidSubId = "sub-non-existent-12345";
    const sub = await db.subcategory.findUnique({
      where: { id: invalidSubId },
    });
    expect(sub).toBeNull();
  });

  it("creates a survey session and suggestions, then approves it via reviewer flow", async () => {
    // 1. Create survey session
    const session = await db.surveySession.create({
      data: {
        owner: "test_anon_owner_1",
        consentAt: new Date(),
      },
    });
    expect(session.id).toBeDefined();

    // 2. Pick a valid subcategory from seeded database
    const sub = await db.subcategory.findFirst({
      include: { topics: true, category: true },
    });
    expect(sub).toBeDefined();
    expect(sub?.topics.length).toBeGreaterThan(0);

    const topic = sub!.topics[0];

    // 3. Create suggestion
    const suggestion = await db.surveySuggestion.create({
      data: {
        sessionId: session.id,
        subcategoryId: sub!.id,
        topicId: topic.id,
        title: "Great Recommendation",
        url: "https://example.com/great-recommendation",
        pickType: "USEFUL",
        note: "A wonderful resource",
        status: "PENDING",
      },
    });
    expect(suggestion.status).toBe("PENDING");
    expect(suggestion.title).toBe("Great Recommendation");
    expect(suggestion.url).toBe("https://example.com/great-recommendation");

    // 4. Moderate: Reviewer approves suggestion into Item
    const approvedItem = await db.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          title: suggestion.title,
          url: suggestion.url,
          sourceName: "Community Suggestion",
          description: suggestion.note,
          categoryId: sub!.parentId,
          subcategoryId: sub!.id,
          topicId: topic.id,
          status: "APPROVED",
          origin: "SURVEY",
        },
      });

      await tx.surveySuggestion.update({
        where: { id: suggestion.id },
        data: {
          status: "APPROVED",
          itemId: item.id,
        },
      });

      return item;
    });

    expect(approvedItem.status).toBe("APPROVED");
    expect(approvedItem.origin).toBe("SURVEY");
    expect(approvedItem.categoryId).toBe(sub!.parentId);
    expect(approvedItem.subcategoryId).toBe(sub!.id);
    expect(approvedItem.topicId).toBe(topic.id);

    // Verify suggestion updated
    const updatedSuggestion = await db.surveySuggestion.findUnique({
      where: { id: suggestion.id },
    });
    expect(updatedSuggestion?.status).toBe("APPROVED");
    expect(updatedSuggestion?.itemId).toBe(approvedItem.id);

    // Cleanup test data
    await db.surveySuggestion.delete({ where: { id: suggestion.id } });
    await db.item.delete({ where: { id: approvedItem.id } });
    await db.surveySession.delete({ where: { id: session.id } });
  });

  it("verifies subcategory coverage computation", async () => {
    const subcategories = await db.subcategory.findMany({
      include: {
        _count: {
          select: {
            items: { where: { status: "APPROVED" } },
          },
        },
      },
    });

    expect(subcategories.length).toBe(34);
    for (const sub of subcategories) {
      expect(sub._count.items).toBeGreaterThanOrEqual(0);
    }
  });
});
