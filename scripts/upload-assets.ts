/**
 * Script to upload member photos to Supabase Storage and update database
 * Run with: npx tsx scripts/upload-assets.ts
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

// Member photo mappings
const MEMBER_PHOTOS: Record<string, string> = {
  "Fabián Fay": "Fabian.webp",
  "Milton Fornella": "Milton.jpg",
  "Giancarlo Sanguinetti": "Giancarlo.jpg",
  "Paulo Díaz Meyer": "Paulo.webp",
};

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
        fileSizeLimit: 10485760, // 10MB
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
  const fileBuffer = fs.readFileSync(localPath);
  const fileName = path.basename(localPath);
  const mimeType = getMimeType(fileName);

  console.log(`  Uploading ${fileName}...`);

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

  console.log(`  ✅ Uploaded: ${data.path}`);
  return data.path;
}

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

async function uploadMemberPhotos() {
  console.log("\n👥 Uploading member photos...");

  const photosDir = path.join(process.cwd(), "public", "images", "members");

  if (!fs.existsSync(photosDir)) {
    console.log(`  ⚠️ Photos directory not found: ${photosDir}`);
    return;
  }

  for (const [memberName, photoFile] of Object.entries(MEMBER_PHOTOS)) {
    const localPath = path.join(photosDir, photoFile);

    if (!fs.existsSync(localPath)) {
      console.log(`  ⚠️ Photo not found for ${memberName}: ${localPath}`);
      continue;
    }

    // Upload to Supabase Storage
    const storagePath = `members/${photoFile}`;
    const uploadedPath = await uploadFile(localPath, storagePath);

    if (!uploadedPath) continue;

    // Get file stats
    const stats = fs.statSync(localPath);

    // Create Asset record
    const asset = await prisma.asset.upsert({
      where: {
        bucket_path: {
          bucket: BUCKET_NAME,
          path: uploadedPath,
        },
      },
      update: {
        filename: photoFile,
        mimeType: getMimeType(photoFile),
        sizeBytes: stats.size,
      },
      create: {
        type: "IMAGE",
        bucket: BUCKET_NAME,
        path: uploadedPath,
        filename: photoFile,
        mimeType: getMimeType(photoFile),
        sizeBytes: stats.size,
      },
    });

    console.log(`  📝 Asset record: ${asset.id}`);

    // Update ExecutiveMember
    const member = await prisma.executiveMember.findFirst({
      where: { fullName: memberName },
    });

    if (member) {
      await prisma.executiveMember.update({
        where: { id: member.id },
        data: { photoAssetId: asset.id },
      });
      console.log(`  ✅ Updated ${memberName} with photo`);
    } else {
      console.log(`  ⚠️ Member not found: ${memberName}`);
    }
  }
}

async function main() {
  console.log("🚀 Starting asset upload...\n");
  console.log("=".repeat(50));

  try {
    await ensureBucketExists();
    await uploadMemberPhotos();

    console.log(`\n${"=".repeat(50)}`);
    console.log("✨ Asset upload complete!\n");

    // Summary
    const assetCount = await prisma.asset.count();
    const membersWithPhotos = await prisma.executiveMember.count({
      where: { photoAssetId: { not: null } },
    });

    console.log("📊 Summary:");
    console.log(`   Total Assets: ${assetCount}`);
    console.log(`   Members with photos: ${membersWithPhotos}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
