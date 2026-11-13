import { describe, it, expect } from "vitest";
import { parseCsv, csvRowSchema, buildTaxonomyLookup } from "../../scripts/import-seed-csv";

describe("CSV Seed Importer (import-content skill)", () => {
  const lookup = buildTaxonomyLookup();

  it("parses valid CSV string into structured records", () => {
    const csv = `title,url,category,subcategory,topic
Sample Guide,https://example.com/guide,read,news-articles,news-articles-world`;
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Sample Guide");
    expect(rows[0].category).toBe("read");
  });

  it("validates valid row schema", () => {
    const validRow = {
      title: "MIT Tech Review",
      url: "https://www.technologyreview.com",
      category: "read",
      subcategory: "news-articles",
      topic: "news-articles-tech-and-science",
      source_name: "MIT",
      cost: "free" as const,
    };
    const parsed = csvRowSchema.safeParse(validRow);
    expect(parsed.success).toBe(true);
  });

  it("rejects row with invalid URL", () => {
    const invalidRow = {
      title: "Broken",
      url: "not-a-valid-url",
      category: "read",
      subcategory: "news-articles",
      topic: "news-articles-world",
    };
    const parsed = csvRowSchema.safeParse(invalidRow);
    expect(parsed.success).toBe(false);
  });

  it("rejects non-existent category", () => {
    const category = lookup.categoriesBySlug.get("non-existent-category");
    expect(category).toBeUndefined();
  });

  it("rejects subcategory that does not belong to category (D2, Rule 5)", () => {
    const cat = lookup.categoriesBySlug.get("read");
    const podcastsSub = lookup.subcategoriesBySlug.get("podcasts"); // belongs to 'listen', not 'read'

    expect(cat).toBeDefined();
    expect(podcastsSub).toBeDefined();
    expect(podcastsSub?.parentId).not.toBe(cat?.id);
  });

  it("rejects topic that does not belong to subcategory (D2, Rule 5)", () => {
    const newsSub = lookup.subcategoriesBySlug.get("news-articles");
    const puzzleTopic = lookup.topicsBySlug.get("puzzles-puzzles"); // belongs to 'puzzles-quizzes-simulations-and-interactive-stories'

    expect(newsSub).toBeDefined();
    expect(puzzleTopic).toBeDefined();
    expect(puzzleTopic?.parentId).not.toBe(newsSub?.id);
  });
});
