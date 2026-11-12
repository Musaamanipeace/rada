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

async function main() {
  const filePath = resolve(process.cwd(), "data/taxonomy.json");
  const raw = readFileSync(filePath, "utf-8");
  const data: TaxonomyFile = JSON.parse(raw);

  console.log(`Seeding taxonomy from data/taxonomy.json (version ${data.version})...`);

  let categoriesCount = 0;
  let subcategoriesCount = 0;
  let topicsCount = 0;

  for (const cat of data.categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {
        slug: cat.slug,
        name: cat.name,
        sort: cat.sort,
      },
      create: {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        sort: cat.sort,
      },
    });
    categoriesCount++;

    for (const sub of cat.subcategories) {
      await prisma.subcategory.upsert({
        where: { id: sub.id },
        update: {
          parentId: cat.id,
          slug: sub.slug,
          name: sub.name,
          sort: sub.sort,
        },
        create: {
          id: sub.id,
          parentId: cat.id,
          slug: sub.slug,
          name: sub.name,
          sort: sub.sort,
        },
      });
      subcategoriesCount++;

      for (const top of sub.topics) {
        await prisma.topic.upsert({
          where: { id: top.id },
          update: {
            parentId: sub.id,
            slug: top.slug,
            name: top.name,
            sort: top.sort,
          },
          create: {
            id: top.id,
            parentId: sub.id,
            slug: top.slug,
            name: top.name,
            sort: top.sort,
          },
        });
        topicsCount++;
      }
    }
  }

  console.log(
    `✅ Taxonomy seeded successfully: ${categoriesCount} categories, ${subcategoriesCount} subcategories, ${topicsCount} topics.`
  );
}

main()
  .catch((e) => {
    console.error("Failed to seed taxonomy:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
