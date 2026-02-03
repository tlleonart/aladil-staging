/**
 * Script to upload ALL assets from aladil-web to Supabase Storage
 * Run with: npx tsx scripts/upload-all-assets.ts
 */

import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import * as fs from "node:fs";
import * as path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Prisma client
const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_PRISMA_URL is required");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Bucket name for assets
const BUCKET_NAME = "assets";

// Path to aladil-web assets
const ALADIL_WEB_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  "Documents/c14/repos/aladil-web",
);

// Lab logo mappings (filename -> lab name in DB)
const LAB_LOGOS: Record<string, string> = {
  "cibic.webp": "Cibic Laboratorios",
  "lac.webp": "LAC",
  "amadita.webp": "Amadita",
  "meyer.webp": "Meyer Lab",
  "labin.webp": "LABIN",
  "biotest.webp": "Biotest",
  "laboratorio_medico_referencia.webp": "Biomédica de Referencia",
  // "cp.webp": unknown lab
  // "db.webp": unknown lab
  // "lcm.webp": unknown lab
};

// Meeting cover mappings (filename -> meeting number)
const MEETING_COVERS: Record<string, number> = {
  "rosario.png": 33, // Rosario, Argentina 2023
  "montevideo.jpeg": 34, // Montevideo, Uruguay 2024
  "asuncion.jpg": 35, // Asunción, Paraguay 2025
  "la-paz.webp": 36, // Santa Cruz, Bolivia 2025 (using la-paz as closest)
  "costa-rica.png": 37, // Costa Rica 2026 (draft)
  "guatemala.jpg": 32, // Guatemala 2022
  "dominicana.jpg": 31, // placeholder
  "virtual.png": 30, // Virtual 2020
};

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

function getAssetType(filename: string): "IMAGE" | "PDF" | "OTHER" {
  const ext = path.extname(filename).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
    return "IMAGE";
  }
  if (ext === ".pdf") {
    return "PDF";
  }
  return "OTHER";
}

async function ensureBucketExists() {
  console.log(`\n📦 Checking bucket "${BUCKET_NAME}"...`);

  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) {
    console.error("Error listing buckets:", listError);
    throw listError;
  }

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`  Creating bucket "${BUCKET_NAME}"...`);
    const { error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: true,
        fileSizeLimit: 52428800, // 50MB
      },
    );

    if (createError) {
      console.error("Error creating bucket:", createError);
      throw createError;
    }
    console.log(`  ✅ Bucket created`);
  } else {
    console.log(`  ✅ Bucket exists`);
  }
}

async function uploadFile(
  localPath: string,
  storagePath: string,
): Promise<string | null> {
  if (!fs.existsSync(localPath)) {
    console.log(`  ⚠️ File not found: ${localPath}`);
    return null;
  }

  const fileBuffer = fs.readFileSync(localPath);
  const fileName = path.basename(localPath);
  const mimeType = getMimeType(fileName);

  console.log(`  Uploading ${fileName} -> ${storagePath}...`);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error(`  ❌ Error uploading ${fileName}:`, error);
    return null;
  }

  return data.path;
}

async function createAssetRecord(
  storagePath: string,
  filename: string,
  localPath: string,
): Promise<string | null> {
  const stats = fs.statSync(localPath);

  const asset = await prisma.asset.upsert({
    where: {
      bucket_path: {
        bucket: BUCKET_NAME,
        path: storagePath,
      },
    },
    update: {
      filename,
      mimeType: getMimeType(filename),
      sizeBytes: stats.size,
    },
    create: {
      type: getAssetType(filename),
      bucket: BUCKET_NAME,
      path: storagePath,
      filename,
      mimeType: getMimeType(filename),
      sizeBytes: stats.size,
    },
  });

  return asset.id;
}

async function uploadLabLogos() {
  console.log("\n🏢 Uploading lab logos...");

  const logosDir = path.join(
    ALADIL_WEB_PATH,
    "src/modules/home/components/sections/partners/assets",
  );

  for (const [filename, labName] of Object.entries(LAB_LOGOS)) {
    const localPath = path.join(logosDir, filename);
    const storagePath = `labs/${filename}`;

    const uploadedPath = await uploadFile(localPath, storagePath);
    if (!uploadedPath) continue;

    const assetId = await createAssetRecord(uploadedPath, filename, localPath);
    if (!assetId) continue;

    // Update lab record
    const lab = await prisma.lab.findFirst({
      where: { name: labName },
    });

    if (lab) {
      await prisma.lab.update({
        where: { id: lab.id },
        data: { logoAssetId: assetId },
      });
      console.log(`  ✅ ${labName} logo updated`);
    } else {
      console.log(`  ⚠️ Lab not found: ${labName}`);
    }
  }
}

async function uploadMeetingCovers() {
  console.log("\n📅 Uploading meeting covers...");

  const meetingsDirs = [
    path.join(
      ALADIL_WEB_PATH,
      "src/modules/home/components/sections/meetings/assets",
    ),
    path.join(ALADIL_WEB_PATH, "src/modules/meetings/past/assets"),
    path.join(ALADIL_WEB_PATH, "src/modules/meetings/last/assets"),
  ];

  for (const [filename, meetingNumber] of Object.entries(MEETING_COVERS)) {
    let localPath: string | null = null;

    // Find file in any of the directories
    for (const dir of meetingsDirs) {
      const testPath = path.join(dir, filename);
      if (fs.existsSync(testPath)) {
        localPath = testPath;
        break;
      }
    }

    if (!localPath) {
      console.log(`  ⚠️ File not found: ${filename}`);
      continue;
    }

    const storagePath = `meetings/${filename}`;
    const uploadedPath = await uploadFile(localPath, storagePath);
    if (!uploadedPath) continue;

    const assetId = await createAssetRecord(uploadedPath, filename, localPath);
    if (!assetId) continue;

    // Update meeting record
    const meeting = await prisma.meeting.findFirst({
      where: { number: meetingNumber },
    });

    if (meeting) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { coverAssetId: assetId },
      });
      console.log(`  ✅ Meeting #${meetingNumber} cover updated`);
    } else {
      console.log(`  ⚠️ Meeting #${meetingNumber} not found`);
    }
  }
}

async function uploadGeneralAssets() {
  console.log("\n🖼️ Uploading general assets...");

  const generalAssets = [
    {
      localPath: path.join(ALADIL_WEB_PATH, "public/logo.png"),
      storagePath: "general/logo.png",
    },
    {
      localPath: path.join(ALADIL_WEB_PATH, "public/history.jpg"),
      storagePath: "general/history.jpg",
    },
    {
      localPath: path.join(
        ALADIL_WEB_PATH,
        "src/modules/home/components/sections/about/assets/background.jpeg",
      ),
      storagePath: "general/about-background.jpeg",
    },
    {
      localPath: path.join(
        ALADIL_WEB_PATH,
        "src/modules/home/components/sections/main/assets/aladil_test.jpg",
      ),
      storagePath: "general/hero-banner.jpg",
    },
  ];

  for (const { localPath, storagePath } of generalAssets) {
    const uploadedPath = await uploadFile(localPath, storagePath);
    if (!uploadedPath) continue;

    const filename = path.basename(localPath);
    await createAssetRecord(uploadedPath, filename, localPath);
    console.log(`  ✅ Uploaded ${filename}`);
  }
}

async function uploadMeetingPdfs() {
  console.log("\n📄 Uploading meeting PDFs...");

  const pdfDir = path.join(ALADIL_WEB_PATH, "public/meetings-pdf");

  if (!fs.existsSync(pdfDir)) {
    console.log("  ⚠️ No PDFs directory found");
    return;
  }

  const files = fs.readdirSync(pdfDir).filter((f) => f.endsWith(".pdf"));

  for (const filename of files) {
    const localPath = path.join(pdfDir, filename);
    const storagePath = `meetings-pdf/${filename}`;

    const uploadedPath = await uploadFile(localPath, storagePath);
    if (!uploadedPath) continue;

    const assetId = await createAssetRecord(uploadedPath, filename, localPath);

    // Try to associate with meeting (asuncion.pdf -> Asunción meeting)
    if (filename === "asuncion.pdf") {
      const meeting = await prisma.meeting.findFirst({
        where: { number: 35 }, // Asunción meeting
      });

      if (meeting) {
        await prisma.meeting.update({
          where: { id: meeting.id },
          data: { topicsPdfAssetId: assetId },
        });
        console.log(`  ✅ Associated PDF with Meeting #35`);
      }
    }

    console.log(`  ✅ Uploaded ${filename}`);
  }
}

async function uploadFlags() {
  console.log("\n🏳️ Uploading country flags...");

  const flagsDir = path.join(ALADIL_WEB_PATH, "public/flags");

  if (!fs.existsSync(flagsDir)) {
    console.log("  ⚠️ No flags directory found");
    return;
  }

  const files = fs.readdirSync(flagsDir).filter((f) => f.endsWith(".svg"));

  for (const filename of files) {
    const localPath = path.join(flagsDir, filename);
    const storagePath = `flags/${filename}`;

    const uploadedPath = await uploadFile(localPath, storagePath);
    if (!uploadedPath) continue;

    await createAssetRecord(uploadedPath, filename, localPath);
    console.log(`  ✅ Uploaded ${filename}`);
  }
}

async function main() {
  console.log("🚀 Starting FULL asset upload...\n");
  console.log("=".repeat(50));
  console.log(`Source: ${ALADIL_WEB_PATH}`);
  console.log("=".repeat(50));

  try {
    await ensureBucketExists();
    await uploadLabLogos();
    await uploadMeetingCovers();
    await uploadGeneralAssets();
    await uploadMeetingPdfs();
    await uploadFlags();

    console.log(`\n${"=".repeat(50)}`);
    console.log("✨ Full asset upload complete!\n");

    // Summary
    const assetCount = await prisma.asset.count();
    const labsWithLogos = await prisma.lab.count({
      where: { logoAssetId: { not: null } },
    });
    const meetingsWithCovers = await prisma.meeting.count({
      where: { coverAssetId: { not: null } },
    });
    const membersWithPhotos = await prisma.executiveMember.count({
      where: { photoAssetId: { not: null } },
    });

    console.log("📊 Summary:");
    console.log(`   Total Assets: ${assetCount}`);
    console.log(`   Labs with logos: ${labsWithLogos}`);
    console.log(`   Meetings with covers: ${meetingsWithCovers}`);
    console.log(`   Members with photos: ${membersWithPhotos}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
