import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import taxonomyData from "../data/taxonomy.json";

const prisma = new PrismaClient();

// CSV row schema
export const csvRowSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  url: z.string().trim().url("Valid URL is required"),
  category: z.string().trim().min(1, "Category slug is required"),
  subcategory: z.string().trim().min(1, "Subcategory slug is required"),
  topic: z.string().trim().min(1, "Topic slug is required"),
  source_name: z.string().trim().optional().default("Curated"),
  description: z.string().trim().max(280, "Description max 280 chars").optional().nullable(),
  cost: z.enum(["free", "paid", "unknown"]).optional().default("unknown"),
  starts_at: z.string().datetime().optional().nullable(),
  ends_at: z.string().datetime().optional().nullable(),
  timezone: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
});

export type CsvRowInput = z.infer<typeof csvRowSchema>;

export interface ImportResult {
  totalRows: number;
  imported: number;
  duplicates: number;
  expired: number;
  rejected: number;
  errors: Array<{ row: number; reason: string }>;
}

// Build taxonomy lookup map
interface TaxonomyLookup {
  categoriesBySlug: Map<string, { id: string; name: string }>;
  subcategoriesBySlug: Map<
    string,
    { id: string; name: string; parentId: string }
  >;
  topicsBySlug: Map<string, { id: string; name: string; parentId: string }>;
}

export function buildTaxonomyLookup(): TaxonomyLookup {
  const categoriesBySlug = new Map<string, { id: string; name: string }>();
  const subcategoriesBySlug = new Map<
    string,
    { id: string; name: string; parentId: string }
  >();
  const topicsBySlug = new Map<
    string,
    { id: string; name: string; parentId: string }
  >();

  for (const cat of taxonomyData.categories) {
    categoriesBySlug.set(cat.slug, { id: cat.id, name: cat.name });
    for (const sub of cat.subcategories) {
      subcategoriesBySlug.set(sub.slug, {
        id: sub.id,
        name: sub.name,
        parentId: cat.id,
      });
      for (const top of sub.topics) {
        topicsBySlug.set(top.slug, {
          id: top.id,
          name: top.name,
          parentId: sub.id,
        });
      }
    }
  }

  return { categoriesBySlug, subcategoriesBySlug, topicsBySlug };
}

export function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || "";
    }
    rows.push(row);
  }

  return rows;
}

export async function importSeedCsv(
  filePath: string,
  autoApprove: boolean = false
): Promise<ImportResult> {
  const lookup = buildTaxonomyLookup();
  const raw = readFileSync(filePath, "utf-8");
  const rawRows = parseCsv(raw);

  const result: ImportResult = {
    totalRows: rawRows.length,
    imported: 0,
    duplicates: 0,
    expired: 0,
    rejected: 0,
    errors: [],
  };

  const now = new Date();

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rowNumber = idx + 2; // accounting for 1-based index and header
    const rawRow = rawRows[idx];

    // 1. Zod Validation
    const parsed = csvRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      result.rejected++;
      result.errors.push({
        row: rowNumber,
        reason: parsed.error.issues.map((i) => i.message).join("; "),
      });
      continue;
    }

    const row = parsed.data;

    // 2. Strict Taxonomy Hierarchy Mapping (Rule 5, D2)
    const category = lookup.categoriesBySlug.get(row.category);
    if (!category) {
      result.rejected++;
      result.errors.push({
        row: rowNumber,
        reason: `Category '${row.category}' does not exist in taxonomy.json`,
      });
      continue;
    }

    const subcategory = lookup.subcategoriesBySlug.get(row.subcategory);
    if (!subcategory || subcategory.parentId !== category.id) {
      result.rejected++;
      result.errors.push({
        row: rowNumber,
        reason: `Subcategory '${row.subcategory}' does not belong to category '${row.category}'`,
      });
      continue;
    }

    const topic = lookup.topicsBySlug.get(row.topic);
    if (!topic || topic.parentId !== subcategory.id) {
      result.rejected++;
      result.errors.push({
        row: rowNumber,
        reason: `Topic '${row.topic}' does not belong to subcategory '${row.subcategory}'`,
      });
      continue;
    }

    // 3. Past-Dated Items Expiration
    let startsAt = row.starts_at ? new Date(row.starts_at) : null;
    let endsAt = row.ends_at ? new Date(row.ends_at) : null;

    if (endsAt && endsAt < now) {
      result.expired++;
      continue;
    } else if (!endsAt && startsAt && startsAt < now) {
      result.expired++;
      continue;
    }

    // 4. Duplicate Check
    const existing = await prisma.item.findUnique({
      where: { url: row.url },
    });

    if (existing) {
      result.duplicates++;
      await prisma.item.update({
        where: { id: existing.id },
        data: { popularityCount: { increment: 1 } },
      });
      continue;
    }

    // 5. Insert Item
    await prisma.item.create({
      data: {
        title: row.title,
        url: row.url,
        sourceName: row.source_name || "Curated",
        description: row.description || null,
        categoryId: category.id,
        subcategoryId: subcategory.id,
        topicId: topic.id,
        cost:
          row.cost === "free" ? "FREE" : row.cost === "paid" ? "PAID" : "UNKNOWN",
        startsAt,
        endsAt,
        timezone: row.timezone || null,
        region: row.region || null,
        status: autoApprove ? "APPROVED" : "PENDING",
        origin: "SEED",
      },
    });

    result.imported++;
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0] || resolve(process.cwd(), "data/seed/sample-seed.csv");
  const autoApprove = args.includes("--auto-approve");

  if (!existsSync(filePath)) {
    console.error(`Seed file not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Importing seed CSV from: ${filePath}...`);
  const result = await importSeedCsv(filePath, autoApprove);

  console.log("\n--- Import Summary ---");
  console.log(`Total rows processed: ${result.totalRows}`);
  console.log(`Imported: ${result.imported}`);
  console.log(`Duplicates merged (+1 popularity): ${result.duplicates}`);
  console.log(`Past-dated expired: ${result.expired}`);
  console.log(`Rejected (invalid/unmapped): ${result.rejected}`);

  if (result.errors.length > 0) {
    console.log("\nRejections:");
    for (const err of result.errors) {
      console.log(`  Row ${err.row}: ${err.reason}`);
    }
  }

  await prisma.$disconnect();
}

if (process.argv[1]?.endsWith("import-seed-csv.ts")) {
  main().catch((err) => {
    console.error("CSV import failed:", err);
    process.exit(1);
  });
}
