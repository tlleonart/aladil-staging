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

// Labs data matching the legacy project (partners.ts)
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

const EXECUTIVE_DATA = [
  {
    fullName: "Fabián Fay",
    position: "Presidente",
    countryCode: "AR",
    labName: "Cibic",
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
    labName: "Amadita",
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

// Meeting data - all 37 meetings with accurate legacy data
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
