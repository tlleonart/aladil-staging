import { createClient } from "@supabase/supabase-js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

// Database setup
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

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase credentials are required");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = "assets";
const IMAGES_DIR = "temp-meeting-images";

// Mapping of image files to meeting numbers
const IMAGE_MEETING_MAP: Record<string, number[]> = {
  "costa-rica.64b4c6a0.png": [37, 23, 15], // Costa Rica meetings
  "la-paz.4835c73c.webp": [36], // Bolivia (Santa Cruz)
  "asuncion.4ca2d629.jpg": [35, 25, 16], // Paraguay meetings
  "montevideo.853a3c9f.jpeg": [34, 26], // Uruguay meetings
  "rosario.3108c21e.png": [33, 20, 9, 5], // Argentina (Rosario) meetings
  "guatemala.aac9e333.jpg": [32], // Guatemala
  "dominicana.3f3e4819.jpg": [29, 17], // Dominican Republic meetings
  "virtual.a6ad750e.png": [30], // Virtual meeting
};

// Additional mappings for other meetings based on country
const COUNTRY_IMAGE_MAP: Record<string, string> = {
  CO: "dominicana.3f3e4819.jpg", // Colombia - use dominicana as placeholder
  MX: "guatemala.aac9e333.jpg", // Mexico - use guatemala as placeholder
  BR: "montevideo.853a3c9f.jpeg", // Brazil - use montevideo as placeholder
  PE: "asuncion.4ca2d629.jpg", // Peru - use asuncion as placeholder
  EC: "virtual.a6ad750e.png", // Ecuador - use virtual as placeholder
  HN: "guatemala.aac9e333.jpg", // Honduras - use guatemala as placeholder
  CL: "costa-rica.64b4c6a0.png", // Chile - use costa-rica as placeholder
};

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

async function main() {
  console.log("🚀 Upload Meeting Images Script\n");
  console.log("=".repeat(50));

  // Step 1: Upload images to Supabase
  console.log("\n📤 Uploading images to Supabase...");
  const uploadedImages: Record<string, { bucket: string; path: string }> = {};

  for (const filename of Object.keys(IMAGE_MEETING_MAP)) {
    const filepath = path.join(IMAGES_DIR, filename);

    if (!fs.existsSync(filepath)) {
      console.log(`  ⚠️  File not found: ${filename}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filepath);
    const storagePath = `meetings/${filename}`;
    const mimeType = getMimeType(filename);

    // Check if file already exists
    const { data: existingFile } = await supabase.storage
      .from(BUCKET_NAME)
      .list("meetings", { search: filename });

    if (existingFile && existingFile.length > 0) {
      console.log(`  ⏭️  Already exists: ${filename}`);
      uploadedImages[filename] = { bucket: BUCKET_NAME, path: storagePath };
      continue;
    }

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.log(`  ❌ Failed to upload ${filename}: ${error.message}`);
    } else {
      console.log(`  ✅ Uploaded: ${filename}`);
      uploadedImages[filename] = { bucket: BUCKET_NAME, path: storagePath };
    }
  }

  // Step 2: Create/update assets and link to meetings
  console.log("\n🔗 Linking images to meetings...");

  // Get all meetings
  const meetings = await prisma.meeting.findMany({
    select: { id: true, number: true, countryCode: true, coverAssetId: true },
  });

  for (const meeting of meetings) {
    // Find the image for this meeting
    let imageFile: string | null = null;

    // First check direct mapping
    for (const [file, numbers] of Object.entries(IMAGE_MEETING_MAP)) {
      if (numbers.includes(meeting.number)) {
        imageFile = file;
        break;
      }
    }

    // If no direct mapping, try country mapping
    if (
      !imageFile &&
      meeting.countryCode &&
      COUNTRY_IMAGE_MAP[meeting.countryCode]
    ) {
      imageFile = COUNTRY_IMAGE_MAP[meeting.countryCode];
    }

    if (!imageFile || !uploadedImages[imageFile]) {
      continue;
    }

    const imageData = uploadedImages[imageFile];

    // Check if asset already exists
    let asset = await prisma.asset.findFirst({
      where: {
        bucket: imageData.bucket,
        path: imageData.path,
      },
    });

    if (!asset) {
      // Create asset
      asset = await prisma.asset.create({
        data: {
          type: "IMAGE",
          bucket: imageData.bucket,
          path: imageData.path,
          filename: imageFile,
          mimeType: getMimeType(imageFile),
        },
      });
      console.log(`  📦 Created asset for: ${imageFile}`);
    }

    // Update meeting with cover asset
    if (meeting.coverAssetId !== asset.id) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { coverAssetId: asset.id },
      });
      console.log(`  ✅ Linked #${meeting.number} → ${imageFile}`);
    } else {
      console.log(`  ⏭️  #${meeting.number} already linked`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("✨ Done!");

  // Summary
  const withImages = await prisma.meeting.count({
    where: { coverAssetId: { not: null } },
  });
  const total = await prisma.meeting.count();
  console.log(`\n📊 Summary: ${withImages}/${total} meetings have images`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
