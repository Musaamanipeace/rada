import { statSync, readdirSync, existsSync } from "fs";
import { join } from "path";

// Budget configuration (in Kilobytes)
const MAX_SINGLE_CHUNK_KB = 250;
const MAX_TOTAL_STATIC_CHUNKS_KB = 1500;

function getFilesRecursively(dir: string): string[] {
  let files: string[] = [];
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

export function checkBundleBudget(): void {
  console.log("Checking client JS bundle budget...");

  const staticDir = join(process.cwd(), ".next/static/chunks");
  if (!existsSync(staticDir)) {
    console.warn("⚠️  .next/static/chunks directory not found. Please run 'next build' first.");
    return;
  }

  const jsFiles = getFilesRecursively(staticDir);
  let totalBytes = 0;
  const violations: string[] = [];

  for (const file of jsFiles) {
    const stats = statSync(file);
    const sizeKb = stats.size / 1024;
    totalBytes += stats.size;

    if (sizeKb > MAX_SINGLE_CHUNK_KB) {
      violations.push(
        `Chunk ${file.replace(process.cwd(), "")} size (${sizeKb.toFixed(
          2
        )} KB) exceeds budget of ${MAX_SINGLE_CHUNK_KB} KB`
      );
    }
  }

  const totalKb = totalBytes / 1024;
  console.log(`Total static JS chunks size: ${totalKb.toFixed(2)} KB across ${jsFiles.length} chunks.`);

  if (totalKb > MAX_TOTAL_STATIC_CHUNKS_KB) {
    violations.push(
      `Total static chunks size (${totalKb.toFixed(
        2
      )} KB) exceeds total budget of ${MAX_TOTAL_STATIC_CHUNKS_KB} KB`
    );
  }

  if (violations.length > 0) {
    console.error("❌ Bundle budget check failed with violations:");
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    process.exit(1);
  }

  console.log("✅ Bundle budget check passed: all chunks within limits.");
}

if (process.argv[1]?.endsWith("check-bundle-budget.ts")) {
  checkBundleBudget();
}
