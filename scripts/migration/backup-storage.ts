/**
 * Backup Supabase Storage bucket "assets" to local disk.
 * Run: npx dotenv -e .env.local -- npx tsx scripts/migration/backup-storage.ts
 *
 * Walks the bucket recursively, downloads every object, and writes:
 *   ../../aladil-backups/<date>/storage/files/<original/path>
 *   ../../aladil-backups/<date>/storage/_manifest.json
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "assets";
const OUT_DIR = path.resolve(
  __dirname,
  "../../../aladil-backups/2026-04-22/storage",
);
const FILES_DIR = path.join(OUT_DIR, "files");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface ManifestEntry {
  path: string;
  size: number;
  mimeType: string | null;
  updatedAt: string | null;
  localFile: string;
}

async function listRecursive(prefix = ""): Promise<string[]> {
  const all: string[] = [];
  // Supabase list is paginated; default limit 100, we ask for max 1000
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      // folders have id === null; files have id set
      if (item.id === null) {
        const sub = prefix ? `${prefix}/${item.name}` : item.name;
        const subItems = await listRecursive(sub);
        all.push(...subItems);
      } else {
        const full = prefix ? `${prefix}/${item.name}` : item.name;
        all.push(full);
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return all;
}

async function downloadOne(objectPath: string): Promise<ManifestEntry> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(objectPath);
  if (error) throw new Error(`download ${objectPath}: ${error.message}`);
  const buf = Buffer.from(await data.arrayBuffer());
  const localFile = path.join(FILES_DIR, objectPath);
  fs.mkdirSync(path.dirname(localFile), { recursive: true });
  fs.writeFileSync(localFile, buf);
  return {
    path: objectPath,
    size: buf.length,
    mimeType: data.type || null,
    updatedAt: null,
    localFile: path.relative(OUT_DIR, localFile),
  };
}

async function main() {
  fs.mkdirSync(FILES_DIR, { recursive: true });
  console.log(`[backup-storage] Bucket: ${BUCKET}`);
  console.log(`[backup-storage] Output: ${OUT_DIR}`);

  console.log("[backup-storage] Listing objects...");
  const paths = await listRecursive("");
  console.log(`[backup-storage] Found ${paths.length} objects`);

  const manifest: ManifestEntry[] = [];
  let ok = 0;
  let failed = 0;
  for (const p of paths) {
    try {
      const entry = await downloadOne(p);
      manifest.push(entry);
      ok++;
      if (ok % 25 === 0) console.log(`  downloaded ${ok}/${paths.length}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL ${p}:`, (err as Error).message);
    }
  }

  fs.writeFileSync(
    path.join(OUT_DIR, "_manifest.json"),
    JSON.stringify(
      {
        bucket: BUCKET,
        dumpedAt: new Date().toISOString(),
        total: paths.length,
        downloaded: ok,
        failed,
        entries: manifest,
      },
      null,
      2,
    ),
  );

  console.log(
    `[backup-storage] Done: ${ok} downloaded, ${failed} failed, manifest at _manifest.json`,
  );
  if (failed > 0) process.exit(2);
}

main().catch((err) => {
  console.error("[backup-storage] FAILED:", err);
  process.exit(1);
});
