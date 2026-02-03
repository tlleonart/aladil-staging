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

// Legacy project path
const LEGACY_PATH = "../aladil-web";

// Gallery images for meeting #35 (Asunción, Paraguay)
const GALLERY_IMAGES = [
  {
    meetingNumber: 35,
    sourcePath: `${LEGACY_PATH}/src/modules/meetings/last/assets/main.jpeg`,
    storagePath: "meetings/gallery/meeting-35-main.jpeg",
    filename: "meeting-35-main.jpeg",
  },
  {
    meetingNumber: 35,
    sourcePath: `${LEGACY_PATH}/src/modules/meetings/last/assets/sec.jpeg`,
    storagePath: "meetings/gallery/meeting-35-secondary.jpeg",
    filename: "meeting-35-secondary.jpeg",
  },
];

// PDF for meeting #35
const MEETING_PDF = {
  meetingNumber: 35,
  sourcePath: `${LEGACY_PATH}/public/meetings-pdf/asuncion.pdf`,
  storagePath: "meetings/pdf/meeting-35-topics.pdf",
  filename: "meeting-35-topics.pdf",
};

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

async function uploadFile(
  sourcePath: string,
  storagePath: string,
): Promise<boolean> {
  const resolvedPath = path.resolve(process.cwd(), sourcePath);

  if (!fs.existsSync(resolvedPath)) {
    console.log(`  ⚠️  File not found: ${resolvedPath}`);
    return false;
  }

  const fileBuffer = fs.readFileSync(resolvedPath);
  const mimeType = getMimeType(storagePath);

  // Check if file already exists
  const folder = path.dirname(storagePath);
  const filename = path.basename(storagePath);
  const { data: existingFile } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folder, { search: filename });

  if (existingFile && existingFile.length > 0) {
    console.log(`  ⏭️  Already exists: ${storagePath}`);
    return true;
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.log(`  ❌ Failed to upload ${storagePath}: ${error.message}`);
    return false;
  }

  console.log(`  ✅ Uploaded: ${storagePath}`);
  return true;
}

async function getOrCreateAsset(
  storagePath: string,
  filename: string,
  type: "IMAGE" | "PDF",
): Promise<string | null> {
  // Check if asset already exists
  let asset = await prisma.asset.findFirst({
    where: {
      bucket: BUCKET_NAME,
      path: storagePath,
    },
  });

  if (!asset) {
    asset = await prisma.asset.create({
      data: {
        type,
        bucket: BUCKET_NAME,
        path: storagePath,
        filename,
        mimeType: getMimeType(filename),
      },
    });
    console.log(`  📦 Created asset: ${filename}`);
  }

  return asset.id;
}

async function main() {
  console.log("🚀 Upload Meeting Gallery & PDF Script\n");
  console.log("=".repeat(50));

  // Step 1: Upload gallery images
  console.log("\n📤 Uploading gallery images...");

  for (const image of GALLERY_IMAGES) {
    const uploaded = await uploadFile(image.sourcePath, image.storagePath);
    if (!uploaded) continue;

    const assetId = await getOrCreateAsset(
      image.storagePath,
      image.filename,
      "IMAGE",
    );
    if (!assetId) continue;

    // Find meeting
    const meeting = await prisma.meeting.findFirst({
      where: { number: image.meetingNumber },
    });

    if (!meeting) {
      console.log(`  ⚠️  Meeting #${image.meetingNumber} not found`);
      continue;
    }

    // Check if gallery item already exists
    const existingGalleryItem = await prisma.meetingAsset.findFirst({
      where: {
        meetingId: meeting.id,
        assetId: assetId,
      },
    });

    if (existingGalleryItem) {
      console.log(
        `  ⏭️  Gallery item already linked: #${image.meetingNumber} → ${image.filename}`,
      );
      continue;
    }

    // Get the next sort order
    const maxSortOrder = await prisma.meetingAsset.aggregate({
      where: { meetingId: meeting.id },
      _max: { sortOrder: true },
    });

    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    // Create gallery item
    await prisma.meetingAsset.create({
      data: {
        meetingId: meeting.id,
        assetId: assetId,
        sortOrder: nextSortOrder,
      },
    });

    console.log(
      `  ✅ Linked gallery: #${image.meetingNumber} → ${image.filename}`,
    );
  }

  // Step 2: Upload PDF
  console.log("\n📤 Uploading meeting PDF...");

  const pdfUploaded = await uploadFile(
    MEETING_PDF.sourcePath,
    MEETING_PDF.storagePath,
  );
  if (pdfUploaded) {
    const assetId = await getOrCreateAsset(
      MEETING_PDF.storagePath,
      MEETING_PDF.filename,
      "PDF",
    );

    if (assetId) {
      // Find meeting and link PDF
      const meeting = await prisma.meeting.findFirst({
        where: { number: MEETING_PDF.meetingNumber },
      });

      if (meeting) {
        if (meeting.topicsPdfAssetId !== assetId) {
          await prisma.meeting.update({
            where: { id: meeting.id },
            data: { topicsPdfAssetId: assetId },
          });
          console.log(
            `  ✅ Linked PDF: #${MEETING_PDF.meetingNumber} → ${MEETING_PDF.filename}`,
          );
        } else {
          console.log(
            `  ⏭️  PDF already linked: #${MEETING_PDF.meetingNumber}`,
          );
        }
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log("✨ Done!");

  // Summary
  const meetingsWithGallery = await prisma.meeting.count({
    where: {
      gallery: {
        some: {},
      },
    },
  });

  const meetingsWithPdf = await prisma.meeting.count({
    where: {
      topicsPdfAssetId: { not: null },
    },
  });

  const totalMeetings = await prisma.meeting.count();

  console.log(`\n📊 Summary:`);
  console.log(`   Meetings with gallery images: ${meetingsWithGallery}/${totalMeetings}`);
  console.log(`   Meetings with PDF: ${meetingsWithPdf}/${totalMeetings}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
