/**
 * Import Postgres dumps + Supabase Storage backup into Convex.
 * Run: npx dotenv -e .env.local -- npx tsx scripts/migration/import-to-convex.ts
 *
 * Order:
 *   0. (optional) --reset: wipe all tables
 *   1. Upload every file from backups/.../storage/files/** to Convex Storage
 *      -> build { "bucket/path" -> storageId }
 *   2. Import projects, permissions, roles, rolePermissions
 *   3. Import users (with password hashes) + authAccounts
 *   4. Import userProjectRoles
 *   5. Import labs (no logo yet)
 *   6. Link users -> labs
 *   7. Import assets (with storageId from step 1)
 *   8. Link labs -> logoAsset
 *   9. Import executiveMembers, meetings, meetingAssets, newsPosts, newsAssets,
 *      contactMessages, pilaIndicators, pilaReports, pilaReportValues,
 *      pilaPublishedReports, auditEvents
 */

import fs from "node:fs";
import path from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const BACKUP_DIR = path.resolve(
  __dirname,
  "../../../aladil-backups/2026-04-22",
);
const PG_DIR = path.join(BACKUP_DIR, "postgres");
const STORAGE_DIR = path.join(BACKUP_DIR, "storage");
const FILES_DIR = path.join(STORAGE_DIR, "files");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const SECRET = process.env.MIGRATION_SECRET;
if (!CONVEX_URL) throw new Error("NEXT_PUBLIC_CONVEX_URL missing");
if (!SECRET) throw new Error("MIGRATION_SECRET missing");

const client = new ConvexHttpClient(CONVEX_URL);

// ─── Utils ───────────────────────────────────────────────────────────
function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(PG_DIR, file), "utf8")) as T;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function mime(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".pdf":
      return "application/pdf";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

// ─── Step 1: Upload files to Convex Storage ──────────────────────────
interface Manifest {
  bucket: string;
  entries: Array<{
    path: string;
    size: number;
    mimeType: string | null;
    localFile: string;
  }>;
}

async function uploadOne(
  buffer: Buffer,
  contentType: string,
): Promise<Id<"_storage">> {
  const uploadUrl = await client.mutation(api.storage.generateMigrationUploadUrl, {
    secret: SECRET as string,
  });
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: new Uint8Array(buffer),
  });
  if (!res.ok) {
    throw new Error(`upload failed ${res.status}: ${await res.text()}`);
  }
  const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
  return storageId;
}

async function uploadAll(): Promise<Map<string, Id<"_storage">>> {
  const manifestPath = path.join(STORAGE_DIR, "_manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest missing at ${manifestPath}`);
  }
  const manifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf8"),
  ) as Manifest;

  const map = new Map<string, Id<"_storage">>();
  console.log(`[step 1] uploading ${manifest.entries.length} files...`);
  let done = 0;
  for (const entry of manifest.entries) {
    const local = path.join(STORAGE_DIR, entry.localFile);
    const buf = fs.readFileSync(local);
    const ct = entry.mimeType || mime(entry.path);
    const storageId = await uploadOne(buf, ct);
    map.set(`${manifest.bucket}/${entry.path}`, storageId);
    done++;
    if (done % 10 === 0 || done === manifest.entries.length) {
      console.log(`  uploaded ${done}/${manifest.entries.length}`);
    }
  }
  // persist mapping for re-runs
  fs.writeFileSync(
    path.join(STORAGE_DIR, "_storage-map.json"),
    JSON.stringify(Object.fromEntries(map), null, 2),
  );
  console.log(`[step 1] done, mapping written to _storage-map.json`);
  return map;
}

function loadStorageMap(): Map<string, Id<"_storage">> {
  const p = path.join(STORAGE_DIR, "_storage-map.json");
  if (!fs.existsSync(p)) return new Map();
  const obj = JSON.parse(fs.readFileSync(p, "utf8")) as Record<string, string>;
  return new Map(Object.entries(obj) as [string, Id<"_storage">][]);
}

// ─── Data types from pg dumps ────────────────────────────────────────
interface PgUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image: string | null;
  isActive: boolean;
  isSuperAdmin: boolean;
  labId: string | null;
  createdAt: string;
  updatedAt: string;
}
interface PgAccount {
  userId: string;
  providerId: string;
  password: string | null;
}
interface PgProject {
  id: string;
  key:
    | "INTRANET"
    | "NEWS"
    | "MEETINGS"
    | "LABS"
    | "EXEC_COMMITTEE"
    | "SETTINGS"
    | "PILA";
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
interface PgRole {
  id: string;
  projectId: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}
interface PgPermission {
  id: string;
  key: string;
  description: string | null;
}
interface PgRolePermission {
  id: string;
  roleId: string;
  permissionId: string;
}
interface PgUserProjectRole {
  id: string;
  userId: string;
  projectId: string;
  roleId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
interface PgLab {
  id: string;
  name: string;
  countryCode: string;
  city: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  logoAssetId: string | null;
  createdAt: string;
  updatedAt: string;
}
interface PgExecutiveMember {
  id: string;
  fullName: string;
  position: string;
  countryCode: string;
  sortOrder: number;
  isActive: boolean;
  labId: string | null;
  photoAssetId: string | null;
  flagAssetId: string | null;
  createdAt: string;
  updatedAt: string;
}
interface PgMeeting {
  id: string;
  number: number;
  title: string;
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  startDate: string;
  endDate: string | null;
  hostName: string | null;
  hostLabId: string | null;
  summary: string | null;
  content: unknown;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  coverAssetId: string | null;
  topicsPdfAssetId: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
interface PgMeetingAsset {
  id: string;
  meetingId: string;
  assetId: string;
  sortOrder: number;
  createdAt: string;
}
interface PgNewsPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  coverAssetId: string | null;
  authorName: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}
interface PgNewsAsset {
  id: string;
  newsPostId: string;
  assetId: string;
  sortOrder: number;
  createdAt: string;
}
interface PgAsset {
  id: string;
  type: "IMAGE" | "PDF" | "OTHER";
  bucket: string;
  path: string;
  filename: string;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  uploadedById: string | null;
  createdAt: string;
}
interface PgContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
}
interface PgPilaIndicator {
  id: string;
  code: string;
  name: string;
  formula: string;
  numeratorLabel: string;
  denominatorLabel: string;
  considerations: string | null;
  exclusions: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
interface PgPilaReport {
  id: string;
  labId: string;
  submittedById: string | null;
  reviewedById: string | null;
  year: number;
  month: number;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
}
interface PgPilaReportValue {
  id: string;
  reportId: string;
  indicatorId: string;
  numerator: number | null;
  denominator: number | null;
  doesNotReport: boolean;
}
interface PgPilaPublishedReport {
  id: string;
  year: number;
  month: number;
  storagePath: string;
  filename: string;
  sizeBytes: number | null;
  publishedById: string;
  createdAt: string;
}
interface PgAuditEvent {
  id: string;
  userId: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: string;
}

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes("--reset");
  const skipUpload = args.includes("--skip-upload");

  if (shouldReset) {
    console.log("[reset] wiping all tables...");
    const r = await client.mutation(api.migration.reset, {
      secret: SECRET as string,
    });
    console.log(`[reset] deleted ${r.deleted} rows`);
  }

  // Step 1: upload all storage objects (skip if re-running and map exists)
  let storageMap: Map<string, Id<"_storage">>;
  if (skipUpload && loadStorageMap().size > 0) {
    storageMap = loadStorageMap();
    console.log(
      `[step 1] skipped upload, loaded ${storageMap.size} entries from _storage-map.json`,
    );
  } else {
    storageMap = await uploadAll();
  }

  // Step 2: projects, permissions, roles, rolePermissions
  console.log("[step 2] projects, permissions, roles, rolePermissions");
  const projects = readJson<PgProject[]>("Project.json");
  const permissions = readJson<PgPermission[]>("Permission.json");
  const roles = readJson<PgRole[]>("Role.json");
  const rolePermissions = readJson<PgRolePermission[]>("RolePermission.json");

  console.log(
    `  projects=${await logResult(
      client.mutation(api.migration.importProjects, {
        secret: SECRET as string,
        projects: projects.map((p) => ({
          legacyId: p.id,
          key: p.key,
          name: p.name,
          description: p.description,
          isActive: p.isActive,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      }),
    )}`,
  );
  console.log(
    `  permissions=${await logResult(
      client.mutation(api.migration.importPermissions, {
        secret: SECRET as string,
        permissions: permissions.map((p) => ({
          legacyId: p.id,
          key: p.key,
          description: p.description,
        })),
      }),
    )}`,
  );
  console.log(
    `  roles=${await logResult(
      client.mutation(api.migration.importRoles, {
        secret: SECRET as string,
        roles: roles.map((r) => ({
          legacyId: r.id,
          projectLegacyId: r.projectId,
          key: r.key,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      }),
    )}`,
  );
  console.log(
    `  rolePermissions=${await logResult(
      client.mutation(api.migration.importRolePermissions, {
        secret: SECRET as string,
        rolePermissions: rolePermissions.map((rp) => ({
          legacyId: rp.id,
          roleLegacyId: rp.roleId,
          permissionLegacyId: rp.permissionId,
        })),
      }),
    )}`,
  );

  // Step 3: users (+ password hashes from Account.json)
  console.log("[step 3] users + auth accounts");
  const users = readJson<PgUser[]>("User.json");
  const accounts = readJson<PgAccount[]>("Account.json");
  const passwordByUserId = new Map<string, string>();
  for (const a of accounts) {
    if (a.providerId === "credential" && a.password) {
      passwordByUserId.set(a.userId, a.password);
    }
  }
  console.log(
    `  users=${await logResult(
      client.mutation(api.migration.importUsers, {
        secret: SECRET as string,
        users: users.map((u) => ({
          legacyId: u.id,
          email: u.email,
          name: u.name,
          emailVerified: u.emailVerified,
          image: u.image,
          isActive: u.isActive,
          isSuperAdmin: u.isSuperAdmin,
          labLegacyId: u.labId,
          passwordHash: passwordByUserId.get(u.id) ?? null,
        })),
      }),
    )}`,
  );

  // Step 4: userProjectRoles
  console.log("[step 4] userProjectRoles");
  const uprs = readJson<PgUserProjectRole[]>("UserProjectRole.json");
  console.log(
    `  userProjectRoles=${await logResult(
      client.mutation(api.migration.importUserProjectRoles, {
        secret: SECRET as string,
        rows: uprs.map((r) => ({
          legacyId: r.id,
          userLegacyId: r.userId,
          projectLegacyId: r.projectId,
          roleLegacyId: r.roleId,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
      }),
    )}`,
  );

  // Step 5: labs
  console.log("[step 5] labs");
  const labs = readJson<PgLab[]>("Lab.json");
  console.log(
    `  labs=${await logResult(
      client.mutation(api.migration.importLabs, {
        secret: SECRET as string,
        labs: labs.map((l) => ({
          legacyId: l.id,
          name: l.name,
          countryCode: l.countryCode,
          city: l.city,
          websiteUrl: l.websiteUrl,
          isActive: l.isActive,
          sortOrder: l.sortOrder,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
        })),
      }),
    )}`,
  );

  // Step 6: link users -> labs
  console.log("[step 6] link users -> labs");
  const userLabLinks = users
    .filter((u) => u.labId)
    .map((u) => ({ userLegacyId: u.id, labLegacyId: u.labId as string }));
  console.log(
    `  links=${await logResult(
      client.mutation(api.migration.linkUsersToLabs, {
        secret: SECRET as string,
        links: userLabLinks,
      }),
    )}`,
  );

  // Step 7: assets (using storageMap)
  console.log("[step 7] assets");
  const assets = readJson<PgAsset[]>("Asset.json");
  const missingStorage: string[] = [];
  const assetPayload = assets.map((a) => {
    const key = `${a.bucket}/${a.path}`;
    const storageId = storageMap.get(key) ?? null;
    if (!storageId) missingStorage.push(key);
    return {
      legacyId: a.id,
      type: a.type,
      filename: a.filename,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      width: a.width,
      height: a.height,
      uploadedByLegacyId: a.uploadedById,
      createdAt: a.createdAt,
      storageId: storageId ?? undefined,
      legacyBucket: a.bucket,
      legacyPath: a.path,
    };
  });
  if (missingStorage.length > 0) {
    console.warn(
      `  WARN: ${missingStorage.length} assets without matching storage file (will be imported with legacy refs only):`,
    );
    for (const k of missingStorage.slice(0, 5)) console.warn(`    - ${k}`);
    if (missingStorage.length > 5)
      console.warn(`    ... and ${missingStorage.length - 5} more`);
  }
  // batch
  for (const batch of chunk(assetPayload, 50)) {
    console.log(
      `  assets batch=${await logResult(
        client.mutation(api.migration.importAssets, {
          secret: SECRET as string,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          assets: batch as any,
        }),
      )}`,
    );
  }

  // Step 8: link labs -> logo asset
  console.log("[step 8] link labs -> logo asset");
  const labLogoLinks = labs
    .filter((l) => l.logoAssetId)
    .map((l) => ({
      labLegacyId: l.id,
      assetLegacyId: l.logoAssetId as string,
    }));
  console.log(
    `  links=${await logResult(
      client.mutation(api.migration.linkLabLogos, {
        secret: SECRET as string,
        links: labLogoLinks,
      }),
    )}`,
  );

  // Step 9: rest of business data
  console.log("[step 9] remaining tables");

  const execs = readJson<PgExecutiveMember[]>("ExecutiveMember.json");
  console.log(
    `  executiveMembers=${await logResult(
      client.mutation(api.migration.importExecutiveMembers, {
        secret: SECRET as string,
        rows: execs.map((e) => ({
          legacyId: e.id,
          fullName: e.fullName,
          position: e.position,
          countryCode: e.countryCode,
          sortOrder: e.sortOrder,
          isActive: e.isActive,
          labLegacyId: e.labId,
          photoAssetLegacyId: e.photoAssetId,
          flagAssetLegacyId: e.flagAssetId,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        })),
      }),
    )}`,
  );

  const meetings = readJson<PgMeeting[]>("Meeting.json");
  for (const batch of chunk(meetings, 25)) {
    console.log(
      `  meetings batch=${await logResult(
        client.mutation(api.migration.importMeetings, {
          secret: SECRET as string,
          rows: batch.map((m) => ({
            legacyId: m.id,
            number: m.number,
            title: m.title,
            slug: m.slug,
            city: m.city,
            country: m.country,
            countryCode: m.countryCode,
            startDate: m.startDate,
            endDate: m.endDate,
            hostName: m.hostName,
            hostLabLegacyId: m.hostLabId,
            summary: m.summary,
            content: m.content,
            status: m.status,
            coverAssetLegacyId: m.coverAssetId,
            topicsPdfAssetLegacyId: m.topicsPdfAssetId,
            authorLegacyId: m.authorId,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            publishedAt: m.publishedAt,
          })),
        }),
      )}`,
    );
  }

  const meetingAssets = readJson<PgMeetingAsset[]>("MeetingAsset.json");
  console.log(
    `  meetingAssets=${await logResult(
      client.mutation(api.migration.importMeetingAssets, {
        secret: SECRET as string,
        rows: meetingAssets.map((r) => ({
          legacyId: r.id,
          meetingLegacyId: r.meetingId,
          assetLegacyId: r.assetId,
          sortOrder: r.sortOrder,
          createdAt: r.createdAt,
        })),
      }),
    )}`,
  );

  const newsPosts = readJson<PgNewsPost[]>("NewsPost.json");
  console.log(
    `  newsPosts=${await logResult(
      client.mutation(api.migration.importNewsPosts, {
        secret: SECRET as string,
        rows: newsPosts.map((n) => ({
          legacyId: n.id,
          title: n.title,
          slug: n.slug,
          excerpt: n.excerpt,
          content: n.content,
          status: n.status,
          coverAssetLegacyId: n.coverAssetId,
          authorName: n.authorName,
          authorLegacyId: n.authorId,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
          publishedAt: n.publishedAt,
        })),
      }),
    )}`,
  );

  const newsAssets = readJson<PgNewsAsset[]>("NewsAsset.json");
  if (newsAssets.length > 0) {
    console.log(
      `  newsAssets=${await logResult(
        client.mutation(api.migration.importNewsAssets, {
          secret: SECRET as string,
          rows: newsAssets.map((r) => ({
            legacyId: r.id,
            newsPostLegacyId: r.newsPostId,
            assetLegacyId: r.assetId,
            sortOrder: r.sortOrder,
            createdAt: r.createdAt,
          })),
        }),
      )}`,
    );
  }

  const contacts = readJson<PgContactMessage[]>("ContactMessage.json");
  if (contacts.length > 0) {
    console.log(
      `  contactMessages=${await logResult(
        client.mutation(api.migration.importContactMessages, {
          secret: SECRET as string,
          rows: contacts.map((c) => ({
            legacyId: c.id,
            name: c.name,
            email: c.email,
            message: c.message,
            status: c.status,
            createdAt: c.createdAt,
          })),
        }),
      )}`,
    );
  }

  const pilaIndicators = readJson<PgPilaIndicator[]>("PilaIndicator.json");
  console.log(
    `  pilaIndicators=${await logResult(
      client.mutation(api.migration.importPilaIndicators, {
        secret: SECRET as string,
        rows: pilaIndicators.map((i) => ({
          legacyId: i.id,
          code: i.code,
          name: i.name,
          formula: i.formula,
          numeratorLabel: i.numeratorLabel,
          denominatorLabel: i.denominatorLabel,
          considerations: i.considerations,
          exclusions: i.exclusions,
          sortOrder: i.sortOrder,
          isActive: i.isActive,
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        })),
      }),
    )}`,
  );

  const pilaReports = readJson<PgPilaReport[]>("PilaReport.json");
  console.log(
    `  pilaReports=${await logResult(
      client.mutation(api.migration.importPilaReports, {
        secret: SECRET as string,
        rows: pilaReports.map((r) => ({
          legacyId: r.id,
          labLegacyId: r.labId,
          submittedByLegacyId: r.submittedById,
          reviewedByLegacyId: r.reviewedById,
          year: r.year,
          month: r.month,
          status: r.status,
          notes: r.notes,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          submittedAt: r.submittedAt,
          reviewedAt: r.reviewedAt,
        })),
      }),
    )}`,
  );

  const pilaValues = readJson<PgPilaReportValue[]>("PilaReportValue.json");
  for (const batch of chunk(pilaValues, 100)) {
    console.log(
      `  pilaReportValues batch=${await logResult(
        client.mutation(api.migration.importPilaReportValues, {
          secret: SECRET as string,
          rows: batch.map((v) => ({
            legacyId: v.id,
            reportLegacyId: v.reportId,
            indicatorLegacyId: v.indicatorId,
            numerator: v.numerator,
            denominator: v.denominator,
            doesNotReport: v.doesNotReport,
          })),
        }),
      )}`,
    );
  }

  const pilaPublished = readJson<PgPilaPublishedReport[]>(
    "PilaPublishedReport.json",
  );
  if (pilaPublished.length > 0) {
    console.log(
      `  pilaPublishedReports=${await logResult(
        client.mutation(api.migration.importPilaPublishedReports, {
          secret: SECRET as string,
          rows: pilaPublished.map((r) => {
            const key = `assets/${r.storagePath}`;
            const sid = storageMap.get(key);
            return {
              legacyId: r.id,
              year: r.year,
              month: r.month,
              storagePath: r.storagePath,
              storageId: sid ?? null,
              filename: r.filename,
              sizeBytes: r.sizeBytes,
              publishedByLegacyId: r.publishedById,
              createdAt: r.createdAt,
            };
          }),
        }),
      )}`,
    );
  }

  const auditEvents = readJson<PgAuditEvent[]>("AuditEvent.json");
  if (auditEvents.length > 0) {
    for (const batch of chunk(auditEvents, 200)) {
      console.log(
        `  auditEvents batch=${await logResult(
          client.mutation(api.migration.importAuditEvents, {
            secret: SECRET as string,
            rows: batch.map((e) => ({
              legacyId: e.id,
              userLegacyId: e.userId,
              action: e.action,
              entity: e.entity,
              entityId: e.entityId,
              metadata: e.metadata,
              createdAt: e.createdAt,
            })),
          }),
        )}`,
      );
    }
  }

  console.log("\n[done] Migration complete.");
}

async function logResult(p: Promise<unknown>): Promise<string> {
  const r = await p;
  return JSON.stringify(r);
}

main().catch((err) => {
  console.error("[import] FAILED:", err);
  process.exit(1);
});
