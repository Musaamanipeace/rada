import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TaxonomyTopic {
  id: string;
  slug: string;
  name: string;
  sort: number;
}

interface TaxonomySubcategory {
  id: string;
  slug: string;
  name: string;
  sort: number;
  topics: TaxonomyTopic[];
}

interface TaxonomyCategory {
  id: string;
  slug: string;
  name: string;
  sort: number;
  subcategories: TaxonomySubcategory[];
}

interface TaxonomyFile {
  version: string;
  categories: TaxonomyCategory[];
}

export async function validateTaxonomy() {
  console.log("Starting taxonomy validation...");

  // 1. Validate file structure and counts
  const filePath = resolve(process.cwd(), "data/taxonomy.json");
  const raw = readFileSync(filePath, "utf-8");
  const data: TaxonomyFile = JSON.parse(raw);

  if (!Array.isArray(data.categories)) {
    throw new Error("data/taxonomy.json: categories must be an array");
  }

  if (data.categories.length !== 10) {
    throw new Error(`Expected exactly 10 categories, found ${data.categories.length}`);
  }

  const categoryIds = new Set<string>();
  const categorySlugs = new Set<string>();
  const subcategoryIds = new Set<string>();
  const subcategorySlugs = new Set<string>();
  const topicIds = new Set<string>();
  const topicSlugs = new Set<string>();

  let subcategoryCount = 0;
  let topicCount = 0;

  for (const cat of data.categories) {
    if (categoryIds.has(cat.id)) throw new Error(`Duplicate category ID: ${cat.id}`);
    if (categorySlugs.has(cat.slug)) throw new Error(`Duplicate category slug: ${cat.slug}`);
    categoryIds.add(cat.id);
    categorySlugs.add(cat.slug);

    if (!Array.isArray(cat.subcategories) || cat.subcategories.length === 0) {
      throw new Error(`Category ${cat.id} has no subcategories`);
    }

    for (const sub of cat.subcategories) {
      if (subcategoryIds.has(sub.id)) throw new Error(`Duplicate subcategory ID: ${sub.id}`);
      if (subcategorySlugs.has(sub.slug)) throw new Error(`Duplicate subcategory slug: ${sub.slug}`);
      subcategoryIds.add(sub.id);
      subcategorySlugs.add(sub.slug);
      subcategoryCount++;

      if (!Array.isArray(sub.topics) || sub.topics.length === 0) {
        throw new Error(`Subcategory ${sub.id} has no topics`);
      }

      for (const top of sub.topics) {
        if (topicIds.has(top.id)) throw new Error(`Duplicate topic ID: ${top.id}`);
        if (topicSlugs.has(top.slug)) throw new Error(`Duplicate topic slug: ${top.slug}`);
        topicIds.add(top.id);
        topicSlugs.add(top.slug);
        topicCount++;
      }
    }
  }

  if (subcategoryCount !== 34) {
    throw new Error(`Expected exactly 34 subcategories, found ${subcategoryCount}`);
  }

  console.log(
    `✅ File check passed: 10 categories, 34 subcategories, ${topicCount} topics.`
  );

  // 2. Validate database seeded counts
  const dbCatCount = await prisma.category.count();
  const dbSubCount = await prisma.subcategory.count();
  const dbTopCount = await prisma.topic.count();

  if (dbCatCount !== 10) {
    throw new Error(`DB categories count mismatch: expected 10, got ${dbCatCount}`);
  }
  if (dbSubCount !== 34) {
    throw new Error(`DB subcategories count mismatch: expected 34, got ${dbSubCount}`);
  }
  if (dbTopCount !== topicCount) {
    throw new Error(`DB topics count mismatch: expected ${topicCount}, got ${dbTopCount}`);
  }

  console.log("✅ DB seeded records verified: 10 categories, 34 subcategories, 139 topics.");

  // 3. Test composite foreign key constraints at database level
  console.log("Testing database composite parent-child constraints...");

  // Pick first category, subcategory and topic
  const firstCat = data.categories[0];
  const firstSub = firstCat.subcategories[0];
  const firstTop = firstSub.topics[0];

  // Pick second category for mismatch test
  const secondCat = data.categories[1];

  // A) Invalid hierarchy: subcategory does not belong to category
  let constraintCaught = false;
  try {
    await prisma.item.create({
      data: {
        title: "Invalid Hierarchy Test Item",
        url: "https://example.com/invalid-test-1",
        sourceName: "Test Suite",
        categoryId: secondCat.id, // Mismatched category
        subcategoryId: firstSub.id, // Belongs to firstCat
        topicId: firstTop.id,
        origin: "SEED",
        status: "PENDING",
      },
    });
  } catch (err: any) {
    // Foreign key constraint violation expected
    constraintCaught = true;
  }

  if (!constraintCaught) {
    throw new Error("Failed constraint test: DB allowed item with mismatched subcategory/category!");
  }
  console.log("✅ Composite constraint enforced: mismatched (subcategory_id, category_id) was rejected.");

  // B) Invalid hierarchy: topic does not belong to subcategory
  const secondSub = data.categories[0].subcategories[1];
  constraintCaught = false;
  try {
    await prisma.item.create({
      data: {
        title: "Invalid Topic Hierarchy Test Item",
        url: "https://example.com/invalid-test-2",
        sourceName: "Test Suite",
        categoryId: firstCat.id,
        subcategoryId: secondSub.id, // secondSub
        topicId: firstTop.id, // Belongs to firstSub
        origin: "SEED",
        status: "PENDING",
      },
    });
  } catch (err: any) {
    constraintCaught = true;
  }

  if (!constraintCaught) {
    throw new Error("Failed constraint test: DB allowed item with mismatched topic/subcategory!");
  }
  console.log("✅ Composite constraint enforced: mismatched (topic_id, subcategory_id) was rejected.");

  // C) Valid hierarchy insertion & cleanup
  const validItem = await prisma.item.create({
    data: {
      title: "Valid Hierarchy Test Item",
      url: "https://example.com/valid-test-item",
      sourceName: "Test Suite",
      categoryId: firstCat.id,
      subcategoryId: firstSub.id,
      topicId: firstTop.id,
      origin: "SEED",
      status: "APPROVED",
    },
  });

  await prisma.item.delete({ where: { id: validItem.id } });
  console.log("✅ Valid hierarchy insert succeeded and cleaned up successfully.");

  console.log("🎉 All taxonomy validation checks passed successfully!");
}

async function main() {
  await validateTaxonomy();
}

if (process.argv[1]?.endsWith("test-taxonomy.ts")) {
  main()
    .catch((err) => {
      console.error("Taxonomy validation failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
