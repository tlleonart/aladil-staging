import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

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

// =============================================================================
// MEETINGS DATA - All 37 meetings with accurate legacy data
// =============================================================================

const MEETINGS_DATA = [
  // Future
  {
    number: 37,
    city: "San José",
    country: "Costa Rica",
    countryCode: "CR",
    startDate: "2026-05-01",
    hostLabName: "LABIN",
    status: "DRAFT" as const,
  },
  {
    number: 36,
    city: "Santa Cruz de la Sierra",
    country: "Bolivia",
    countryCode: "BO",
    startDate: "2025-11-06",
    endDate: "2025-11-07",
    hostLabName: "Hospital Universitario Martín Dockweiler",
    status: "PUBLISHED" as const,
  },
  // Next meeting
  {
    number: 35,
    city: "Asunción",
    country: "Paraguay",
    countryCode: "PY",
    startDate: "2025-06-05",
    endDate: "2025-06-07",
    hostLabName: "Meyer Lab",
    status: "PUBLISHED" as const,
  },
  // Past meetings
  {
    number: 34,
    city: "Montevideo",
    country: "Uruguay",
    countryCode: "UY",
    startDate: "2024-10-24",
    endDate: "2024-10-26",
    hostLabName: "LAC",
    status: "PUBLISHED" as const,
  },
  {
    number: 33,
    city: "Rosario",
    country: "Argentina",
    countryCode: "AR",
    startDate: "2023-10-31",
    endDate: "2023-11-02",
    hostLabName: "Cibic",
    status: "PUBLISHED" as const,
  },
  {
    number: 32,
    city: "Antigua",
    country: "Guatemala",
    countryCode: "GT",
    startDate: "2022-11-15",
    endDate: "2022-11-18",
    hostLabName: "Biotest",
    status: "PUBLISHED" as const,
  },
  {
    number: 31,
    city: "Medellín",
    country: "Colombia",
    countryCode: "CO",
    startDate: "2019-11-14",
    endDate: "2019-11-16",
    hostLabName: "Laboratorio Médico de Referencia",
    status: "PUBLISHED" as const,
  },
  {
    number: 30,
    city: "Virtual",
    country: "Virtual",
    countryCode: "XX",
    startDate: "2022-06-18",
    endDate: "2022-06-19",
    status: "PUBLISHED" as const,
  },
  {
    number: 29,
    city: "Santo Domingo",
    country: "República Dominicana",
    countryCode: "DO",
    startDate: "2019-11-14",
    hostLabName: "Amadita",
    status: "PUBLISHED" as const,
  },
  {
    number: 28,
    city: "San Miguel de Allende",
    country: "México",
    countryCode: "MX",
    startDate: "2019-06-06",
    status: "PUBLISHED" as const,
  },
  {
    number: 27,
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    startDate: "2018-06-06",
    hostLabName: "Diagnóstico do Brasil",
    status: "PUBLISHED" as const,
  },
  {
    number: 26,
    city: "Montevideo",
    country: "Uruguay",
    countryCode: "UY",
    startDate: "2017-11-15",
    hostLabName: "LAC",
    status: "PUBLISHED" as const,
  },
  {
    number: 25,
    city: "Asunción",
    country: "Paraguay",
    countryCode: "PY",
    startDate: "2017-05-31",
    hostLabName: "Meyer Lab",
    status: "PUBLISHED" as const,
  },
  {
    number: 24,
    city: "Lima",
    country: "Perú",
    countryCode: "PE",
    startDate: "2016-11-08",
    status: "PUBLISHED" as const,
  },
  {
    number: 23,
    city: "San José",
    country: "Costa Rica",
    countryCode: "CR",
    startDate: "2016-05-22",
    hostLabName: "LABIN",
    status: "PUBLISHED" as const,
  },
  {
    number: 22,
    city: "Cancún",
    country: "México",
    countryCode: "MX",
    startDate: "2015-11-16",
    status: "PUBLISHED" as const,
  },
  {
    number: 21,
    city: "Quito",
    country: "Ecuador",
    countryCode: "EC",
    startDate: "2015-06-11",
    status: "PUBLISHED" as const,
  },
  {
    number: 20,
    city: "Rosario",
    country: "Argentina",
    countryCode: "AR",
    startDate: "2014-11-03",
    hostLabName: "Cibic",
    status: "PUBLISHED" as const,
  },
  {
    number: 19,
    city: "Ciudad de México",
    country: "México",
    countryCode: "MX",
    startDate: "2013-11-30",
    status: "PUBLISHED" as const,
  },
  {
    number: 18,
    city: "Tegucigalpa",
    country: "Honduras",
    countryCode: "HN",
    startDate: "2013-05-30",
    hostLabName: "Laboratorio Centro Médico Honduras",
    status: "PUBLISHED" as const,
  },
  {
    number: 17,
    city: "Santo Domingo",
    country: "República Dominicana",
    countryCode: "DO",
    startDate: "2012-11-14",
    hostLabName: "Amadita",
    status: "PUBLISHED" as const,
  },
  {
    number: 16,
    city: "Asunción",
    country: "Paraguay",
    countryCode: "PY",
    startDate: "2012-05-30",
    hostLabName: "Meyer Lab",
    status: "PUBLISHED" as const,
  },
  {
    number: 15,
    city: "San José",
    country: "Costa Rica",
    countryCode: "CR",
    startDate: "2011-11-08",
    hostLabName: "LABIN",
    status: "PUBLISHED" as const,
  },
  {
    number: 14,
    city: "Medellín",
    country: "Colombia",
    countryCode: "CO",
    startDate: "2011-04-05",
    hostLabName: "Laboratorio Médico de Referencia",
    status: "PUBLISHED" as const,
  },
  {
    number: 13,
    city: "Quito",
    country: "Ecuador",
    countryCode: "EC",
    startDate: "2010-11-17",
    status: "PUBLISHED" as const,
  },
  {
    number: 12,
    city: "Cuernavaca",
    country: "México",
    countryCode: "MX",
    startDate: "2010-04-13",
    status: "PUBLISHED" as const,
  },
  {
    number: 11,
    city: "Lima",
    country: "Perú",
    countryCode: "PE",
    startDate: "2009-10-12",
    status: "PUBLISHED" as const,
  },
  {
    number: 10,
    city: "Ciudad de México",
    country: "México",
    countryCode: "MX",
    startDate: "2008-11-12",
    status: "PUBLISHED" as const,
  },
  {
    number: 9,
    city: "Rosario",
    country: "Argentina",
    countryCode: "AR",
    startDate: "2008-04-25",
    hostLabName: "Cibic",
    status: "PUBLISHED" as const,
  },
  {
    number: 8,
    city: "Medellín",
    country: "Colombia",
    countryCode: "CO",
    startDate: "2007-11-24",
    hostLabName: "Laboratorio Médico de Referencia",
    status: "PUBLISHED" as const,
  },
  {
    number: 7,
    city: "Lima",
    country: "Perú",
    countryCode: "PE",
    startDate: "2007-04-29",
    status: "PUBLISHED" as const,
  },
  {
    number: 6,
    city: "Acapulco",
    country: "México",
    countryCode: "MX",
    startDate: "2006-11-22",
    status: "PUBLISHED" as const,
  },
  {
    number: 5,
    city: "Rosario",
    country: "Argentina",
    countryCode: "AR",
    startDate: "2006-04-17",
    hostLabName: "Cibic",
    status: "PUBLISHED" as const,
  },
  {
    number: 4,
    city: "Lima",
    country: "Perú",
    countryCode: "PE",
    startDate: "2005-10-17",
    status: "PUBLISHED" as const,
  },
  {
    number: 3,
    city: "Ciudad de México",
    country: "México",
    countryCode: "MX",
    startDate: "2005-05-16",
    status: "PUBLISHED" as const,
  },
  {
    number: 2,
    city: "São Paulo",
    country: "Brasil",
    countryCode: "BR",
    startDate: "2004-10-01",
    hostLabName: "Diagnóstico do Brasil",
    status: "PUBLISHED" as const,
  },
  {
    number: 1,
    city: "Viña del Mar",
    country: "Chile",
    countryCode: "CL",
    startDate: "2004-05-01",
    hostName: "Dr. Ivo Sapunar",
    status: "PUBLISHED" as const,
  },
];

// =============================================================================
// HELPERS
// =============================================================================

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("🚀 Reset Meetings Script\n");
  console.log("=".repeat(50));

  // Step 1: Get labs map for host lab references
  console.log("\n📦 Loading labs...");
  const labs = await prisma.lab.findMany({
    select: { id: true, name: true },
  });
  const labsMap: Record<string, string> = {};
  for (const lab of labs) {
    labsMap[lab.name] = lab.id;
  }
  console.log(`  Found ${labs.length} labs`);

  // Step 2: Delete all existing meetings
  console.log("\n🗑️  Deleting existing meetings...");
  const deleteResult = await prisma.meeting.deleteMany({});
  console.log(`  Deleted ${deleteResult.count} meetings`);

  // Step 3: Create all meetings with correct data
  console.log("\n📅 Creating meetings...");
  let created = 0;

  for (const meeting of MEETINGS_DATA) {
    const slug = generateSlug(
      `reunion-${meeting.number}-${meeting.city}-${meeting.country}`,
    );

    const hostLabId = meeting.hostLabName
      ? labsMap[meeting.hostLabName] || null
      : null;

    await prisma.meeting.create({
      data: {
        number: meeting.number,
        title: `Reunión #${meeting.number} | ${meeting.city}, ${meeting.country}`,
        slug,
        city: meeting.city,
        country: meeting.country,
        countryCode: meeting.countryCode,
        startDate: new Date(meeting.startDate),
        endDate: meeting.endDate ? new Date(meeting.endDate) : null,
        hostName: meeting.hostName || null,
        hostLabId,
        status: meeting.status,
        publishedAt: meeting.status === "PUBLISHED" ? new Date() : null,
      },
    });

    console.log(
      `  ✅ #${meeting.number} - ${meeting.city}, ${meeting.country}`,
    );
    created++;
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`✨ Done! Created ${created} meetings`);

  // Summary by status
  const byStatus = await prisma.meeting.groupBy({
    by: ["status"],
    _count: true,
  });
  console.log("\n📊 Summary by status:");
  for (const s of byStatus) {
    console.log(`   ${s.status}: ${s._count}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
