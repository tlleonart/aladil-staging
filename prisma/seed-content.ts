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
// DATA DEFINITIONS
// =============================================================================

const LABS_DATA = [
  // Founding Members (2004)
  {
    name: "Cibic Laboratorios",
    countryCode: "AR",
    city: "Rosario",
    websiteUrl: "https://cibic.com.ar",
    sortOrder: 1,
  },
  {
    name: "Laboratorios Fleury",
    countryCode: "BR",
    city: "São Paulo",
    websiteUrl: "https://fleury.com.br",
    sortOrder: 2,
  },
  {
    name: "MedLab",
    countryCode: "PE",
    city: "Lima",
    websiteUrl: "https://medlab.pe",
    sortOrder: 3,
  },
  {
    name: "Biomédica de Referencia",
    countryCode: "MX",
    city: "Mexico City",
    websiteUrl: "https://bioref.com.mx",
    sortOrder: 4,
  },

  // Current Members
  {
    name: "LAC",
    countryCode: "UY",
    city: "Montevideo",
    websiteUrl: "https://lac.com.uy",
    sortOrder: 5,
  },
  {
    name: "Laboratorio Amadita",
    countryCode: "DO",
    city: "Santo Domingo",
    websiteUrl: "https://amadita.com",
    sortOrder: 6,
  },
  {
    name: "Meyer Lab",
    countryCode: "PY",
    city: "Asunción",
    websiteUrl: "https://meyerlab.com.py",
    sortOrder: 7,
  },
  {
    name: "LABIN",
    countryCode: "CR",
    city: "San José",
    websiteUrl: "https://labin.co.cr",
    sortOrder: 8,
  },
  {
    name: "Hospital Universitario Martín Dockweiler",
    countryCode: "BO",
    city: "Santa Cruz de la Sierra",
    websiteUrl: null,
    sortOrder: 9,
  },

  // Placeholder for other countries (to be updated with real data)
  {
    name: "Laboratorio Colombia",
    countryCode: "CO",
    city: "Bogotá",
    websiteUrl: null,
    sortOrder: 10,
  },
  {
    name: "Laboratorio Guatemala",
    countryCode: "GT",
    city: "Guatemala City",
    websiteUrl: null,
    sortOrder: 11,
  },
  {
    name: "Laboratorio Honduras",
    countryCode: "HN",
    city: "Tegucigalpa",
    websiteUrl: null,
    sortOrder: 12,
  },
];

const EXECUTIVE_DATA = [
  {
    fullName: "Fabián Fay",
    position: "Presidente",
    countryCode: "AR",
    labName: "Cibic Laboratorios",
    sortOrder: 1,
  },
  {
    fullName: "Milton Fornella",
    position: "Vice Presidente",
    countryCode: "UY",
    labName: "LAC",
    sortOrder: 2,
  },
  {
    fullName: "Giancarlo Sanguinetti",
    position: "Vice Presidente",
    countryCode: "DO",
    labName: "Laboratorio Amadita",
    sortOrder: 3,
  },
  {
    fullName: "Paulo Díaz Meyer",
    position: "Tesorero",
    countryCode: "PY",
    labName: "Meyer Lab",
    sortOrder: 4,
  },
];

// Meeting data - most recent first
const MEETINGS_DATA = [
  // Upcoming
  {
    number: 37,
    city: "San José",
    country: "Costa Rica",
    countryCode: "CR",
    startDate: "2026-05-01",
    hostLabName: "LABIN",
    status: "DRAFT" as const,
  },

  // Recent (2022-2025)
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
  {
    number: 35,
    city: "Asunción",
    country: "Paraguay",
    countryCode: "PY",
    startDate: "2025-06-01",
    hostLabName: "Meyer Lab",
    status: "PUBLISHED" as const,
  },
  {
    number: 34,
    city: "Montevideo",
    country: "Uruguay",
    countryCode: "UY",
    startDate: "2024-06-01",
    hostLabName: "LAC",
    status: "PUBLISHED" as const,
  },
  {
    number: 33,
    city: "Rosario",
    country: "Argentina",
    countryCode: "AR",
    startDate: "2023-06-01",
    hostLabName: "Cibic Laboratorios",
    status: "PUBLISHED" as const,
  },
  {
    number: 32,
    city: "Antigua",
    country: "Guatemala",
    countryCode: "GT",
    startDate: "2022-06-01",
    hostLabName: "Laboratorio Guatemala",
    status: "PUBLISHED" as const,
  },

  // Historical placeholders (2004-2021) - dates are approximate
  {
    number: 31,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2021-06-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 30,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2020-06-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 29,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2019-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 28,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2019-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 27,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2018-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 26,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2018-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 25,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2017-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 24,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2017-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 23,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2016-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 22,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2016-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 21,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2015-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 20,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2015-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 19,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2014-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 18,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2014-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 17,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2013-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 16,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2013-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 15,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2012-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 14,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2012-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 13,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2011-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 12,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2011-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 11,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2010-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 10,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2010-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 9,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2009-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 8,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2009-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 7,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2008-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 6,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2008-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 5,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2007-11-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 4,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2007-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 3,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2006-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 2,
    city: "TBD",
    country: "TBD",
    countryCode: "XX",
    startDate: "2005-05-01",
    status: "ARCHIVED" as const,
  },
  {
    number: 1,
    city: "Viña del Mar",
    country: "Chile",
    countryCode: "CL",
    startDate: "2004-05-01",
    hostName: "Dr. Ivo Sapunar",
    status: "ARCHIVED" as const,
  },
];

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedLabs() {
  console.log("\n📦 Seeding Labs...");
  const labs: Record<string, string> = {};

  for (const lab of LABS_DATA) {
    const existing = await prisma.lab.findFirst({ where: { name: lab.name } });

    if (existing) {
      console.log(`  ⏭️  Lab already exists: ${lab.name}`);
      labs[lab.name] = existing.id;
    } else {
      const created = await prisma.lab.create({
        data: {
          name: lab.name,
          countryCode: lab.countryCode,
          city: lab.city,
          websiteUrl: lab.websiteUrl,
          isActive: true,
          sortOrder: lab.sortOrder,
        },
      });
      console.log(`  ✅ Created lab: ${lab.name} (${lab.countryCode})`);
      labs[lab.name] = created.id;
    }
  }

  console.log(`  📊 Total: ${Object.keys(labs).length} labs`);
  return labs;
}

async function seedExecutiveMembers(labsMap: Record<string, string>) {
  console.log("\n👥 Seeding Executive Committee...");

  for (const member of EXECUTIVE_DATA) {
    const existing = await prisma.executiveMember.findFirst({
      where: { fullName: member.fullName },
    });

    if (existing) {
      console.log(`  ⏭️  Member already exists: ${member.fullName}`);
      continue;
    }

    const labId = labsMap[member.labName] || null;

    await prisma.executiveMember.create({
      data: {
        fullName: member.fullName,
        position: member.position,
        countryCode: member.countryCode,
        sortOrder: member.sortOrder,
        isActive: true,
        labId,
      },
    });
    console.log(`  ✅ Created member: ${member.fullName} - ${member.position}`);
  }

  const count = await prisma.executiveMember.count();
  console.log(`  📊 Total: ${count} executive members`);
}

async function seedMeetings(labsMap: Record<string, string>) {
  console.log("\n📅 Seeding Meetings...");

  for (const meeting of MEETINGS_DATA) {
    const slug = generateSlug(
      `reunion-${meeting.number}-${meeting.city}-${meeting.country}`,
    );

    const existing = await prisma.meeting.findFirst({
      where: { number: meeting.number },
    });

    if (existing) {
      console.log(`  ⏭️  Meeting already exists: #${meeting.number}`);
      continue;
    }

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
      `  ✅ Created meeting: #${meeting.number} - ${meeting.city}, ${meeting.country}`,
    );
  }

  const count = await prisma.meeting.count();
  console.log(`  📊 Total: ${count} meetings`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log("🚀 Starting ALADIL Content Seed...\n");
  console.log("=".repeat(50));

  // Phase 1: Labs (no dependencies)
  const labsMap = await seedLabs();

  // Phase 2: Executive Members (depends on Labs)
  await seedExecutiveMembers(labsMap);

  // Phase 3: Meetings (depends on Labs)
  await seedMeetings(labsMap);

  console.log(`\n${"=".repeat(50)}`);
  console.log("✨ Content seeding complete!\n");

  // Summary
  const labCount = await prisma.lab.count();
  const execCount = await prisma.executiveMember.count();
  const meetingCount = await prisma.meeting.count();

  console.log("📊 Summary:");
  console.log(`   Labs: ${labCount}`);
  console.log(`   Executive Members: ${execCount}`);
  console.log(`   Meetings: ${meetingCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
