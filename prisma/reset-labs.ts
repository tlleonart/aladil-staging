import * as fs from "node:fs";
import * as path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or POSTGRES_PRISMA_URL is required");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase credentials required");
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = "assets";

// Path to legacy logos
const LEGACY_LOGOS_PATH =
  "C:/Users/tomas/Documents/c14/repos/aladil-web/src/modules/home/components/sections/partners/assets";

// Labs data matching the legacy project
const LABS_DATA = [
  {
    name: "Amadita",
    countryCode: "DO",
    city: "Santo Domingo",
    websiteUrl: "https://amadita.com",
    sortOrder: 1,
    logoFile: "amadita.webp",
  },
  {
    name: "Biotest",
    countryCode: "GT",
    city: "Guatemala City",
    websiteUrl: "https://biotest.com.gt",
    sortOrder: 2,
    logoFile: "biotest.webp",
  },
  {
    name: "Laboratorio Centro Médico Honduras",
    countryCode: "HN",
    city: "Tegucigalpa",
    websiteUrl: "https://laboratorioscentromedico.hn",
    sortOrder: 3,
    logoFile: "lcm.webp",
  },
  {
    name: "LABIN",
    countryCode: "CR",
    city: "San José",
    websiteUrl: "https://labinlab.com",
    sortOrder: 4,
    logoFile: "labin.webp",
  },
  {
    name: "Laboratorio Médico de Referencia",
    countryCode: "CO",
    city: "Medellín",
    websiteUrl: "https://www.labmedico.com",
    sortOrder: 5,
    logoFile: "laboratorio_medico_referencia.webp",
  },
  {
    name: "Diagnóstico do Brasil",
    countryCode: "BR",
    city: "Sorocaba",
    websiteUrl: "https://www.diagnosticosdobrasil.com.br",
    sortOrder: 6,
    logoFile: "db.webp",
  },
  {
    name: "Hospital Universitario Martín Dockweiler",
    countryCode: "BO",
    city: "Santa Cruz de la Sierra",
    websiteUrl:
      "https://www.udabol.edu.bo/internacional/hospital-universitario-2/",
    sortOrder: 7,
    logoFile: "cp.webp",
  },
  {
    name: "Meyer Lab",
    countryCode: "PY",
    city: "Asunción",
    websiteUrl: "https://www.meyerlab.com.py",
    sortOrder: 8,
    logoFile: "meyer.webp",
  },
  {
    name: "LAC",
    countryCode: "UY",
    city: "Montevideo",
    websiteUrl: "https://www.lac.com.uy",
    sortOrder: 9,
    logoFile: "lac.webp",
  },
  {
    name: "Cibic",
    countryCode: "AR",
    city: "Rosario",
    websiteUrl: "https://cibic.com.ar",
    sortOrder: 10,
    logoFile: "cibic.webp",
  },
];

async function uploadLogo(
  logoFile: string,
): Promise<{ bucket: string; path: string } | null> {
  const localPath = path.join(LEGACY_LOGOS_PATH, logoFile);

  if (!fs.existsSync(localPath)) {
    console.log(`  ⚠️  Logo file not found: ${localPath}`);
    return null;
  }

  const fileBuffer = fs.readFileSync(localPath);
  const storagePath = `labs/${logoFile}`;

  // Check if already exists
  const { data: existing } = await supabase.storage
    .from(BUCKET_NAME)
    .list("labs", { search: logoFile });

  if (existing && existing.length > 0) {
    console.log(`  ⏭️  Logo already in storage: ${logoFile}`);
    return { bucket: BUCKET_NAME, path: storagePath };
  }

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (error) {
    console.log(`  ❌ Failed to upload ${logoFile}: ${error.message}`);
    return null;
  }

  console.log(`  ✅ Uploaded logo: ${logoFile}`);
  return { bucket: BUCKET_NAME, path: storagePath };
}

async function main() {
  console.log("🔄 Resetting Labs data...\n");

  // Step 1: Delete all existing labs (cascade will handle related records)
  console.log("🗑️  Deleting existing labs...");
  await prisma.lab.deleteMany({});
  console.log("  ✅ All labs deleted\n");

  // Step 2: Delete orphan assets for labs
  console.log("🗑️  Cleaning up orphan lab assets...");
  const labAssets = await prisma.asset.findMany({
    where: { path: { startsWith: "labs/" } },
  });
  for (const asset of labAssets) {
    await prisma.asset.delete({ where: { id: asset.id } });
  }
  console.log(`  ✅ Cleaned ${labAssets.length} orphan assets\n`);

  // Step 3: Create new labs with logos
  console.log("📦 Creating labs with logos...");

  for (const lab of LABS_DATA) {
    // Upload logo
    const logoInfo = await uploadLogo(lab.logoFile);

    let logoAssetId: string | null = null;

    if (logoInfo) {
      // Create or find asset record
      const existingAsset = await prisma.asset.findFirst({
        where: { bucket: logoInfo.bucket, path: logoInfo.path },
      });

      if (existingAsset) {
        logoAssetId = existingAsset.id;
      } else {
        const newAsset = await prisma.asset.create({
          data: {
            type: "IMAGE",
            bucket: logoInfo.bucket,
            path: logoInfo.path,
            filename: lab.logoFile,
            mimeType: "image/webp",
          },
        });
        logoAssetId = newAsset.id;
      }
    }

    // Create lab
    await prisma.lab.create({
      data: {
        name: lab.name,
        countryCode: lab.countryCode,
        city: lab.city,
        websiteUrl: lab.websiteUrl,
        isActive: true,
        sortOrder: lab.sortOrder,
        logoAssetId,
      },
    });

    console.log(
      `  ✅ Created: ${lab.name} (${lab.countryCode})${logoAssetId ? " with logo" : ""}`,
    );
  }

  // Summary
  const labCount = await prisma.lab.count();
  console.log(`\n📊 Total labs: ${labCount}`);
  console.log("✨ Labs reset complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
