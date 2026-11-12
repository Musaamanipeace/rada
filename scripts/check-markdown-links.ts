import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, dirname, resolve } from "path";

function findMarkdownFiles(dir: string): string[] {
  let results: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === ".next"
    ) {
      continue;
    }

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

export function checkMarkdownLinks(): void {
  console.log("Checking markdown links across documentation...");

  const rootDir = process.cwd();
  const mdFiles = findMarkdownFiles(rootDir);
  let brokenCount = 0;
  let totalLinks = 0;

  // Regular expression to match markdown links [label](target)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (const filePath of mdFiles) {
    const content = readFileSync(filePath, "utf-8");
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(content)) !== null) {
      const target = match[2].trim();
      totalLinks++;

      // Ignore external web links, mailto, tel, and pure in-page anchors
      if (
        target.startsWith("http://") ||
        target.startsWith("https://") ||
        target.startsWith("mailto:") ||
        target.startsWith("tel:") ||
        target.startsWith("#")
      ) {
        continue;
      }

      // Handle file:/// absolute paths or relative file paths
      let targetPath = target;
      if (targetPath.startsWith("file://")) {
        targetPath = targetPath.replace("file://", "");
      }

      // Decode URI components like %20
      try {
        targetPath = decodeURIComponent(targetPath);
      } catch {}

      // Strip anchor hash if present
      const hashIndex = targetPath.indexOf("#");
      if (hashIndex !== -1) {
        targetPath = targetPath.slice(0, hashIndex);
      }

      // Resolve path
      const resolvedPath = targetPath.startsWith("/")
        ? targetPath
        : resolve(dirname(filePath), targetPath);

      if (!existsSync(resolvedPath)) {
        console.error(
          `❌ Broken link in ${filePath.replace(rootDir, "")}:\n   Link target '${target}' -> '${resolvedPath}' does not exist.`
        );
        brokenCount++;
      }
    }
  }

  console.log(`Scanned ${totalLinks} links across ${mdFiles.length} markdown documents.`);

  if (brokenCount > 0) {
    console.error(`❌ Found ${brokenCount} broken markdown link(s).`);
    process.exit(1);
  }

  console.log("✅ All markdown links are valid.");
}

if (process.argv[1]?.endsWith("check-markdown-links.ts")) {
  checkMarkdownLinks();
}
