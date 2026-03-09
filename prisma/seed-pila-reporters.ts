import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("Seeding PILA reporters and reports...\n");

  // ── Fetch required data ────────────────────────────────────────
  const labs = await prisma.lab.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log(`Found ${labs.length} active labs`);

  const indicators = await prisma.pilaIndicator.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log(`Found ${indicators.length} active indicators`);

  // Get the PILA project and lab_reporter role
  const pilaProject = await prisma.project.findUnique({
    where: { key: "PILA" },
  });
  if (!pilaProject) {
    console.error("PILA project not found. Run seed.ts first.");
    return;
  }

  const labReporterRole = await prisma.role.findUnique({
    where: {
      projectId_key: { projectId: pilaProject.id, key: "lab_reporter" },
    },
  });
  if (!labReporterRole) {
    console.error("lab_reporter role not found. Run seed.ts first.");
    return;
  }

  const hashedPassword = await bcrypt.hash("reporter123!", 12);

  // ── Create 1 reporter per lab ──────────────────────────────────
  console.log("\n--- Creating reporter users ---");

  for (const lab of labs) {
    // Generate a clean email slug from the lab name
    const slug = lab.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/(^\.|\.$)/g, "");
    const email = `reporter.${slug}@aladil.org`;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Ensure labId is set
      if (!existing.labId) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { labId: lab.id },
        });
      }
      console.log(`  Skip (exists): ${email} → ${lab.name}`);
      continue;
    }

    // Create user linked to this lab
    const user = await prisma.user.create({
      data: {
        email,
        name: `Reportador ${lab.name}`,
        emailVerified: true,
        isActive: true,
        isSuperAdmin: false,
        labId: lab.id,
      },
    });

    // Create Better Auth credential account
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    // Assign lab_reporter role on PILA project
    await prisma.userProjectRole.create({
      data: {
        userId: user.id,
        projectId: pilaProject.id,
        roleId: labReporterRole.id,
        isActive: true,
      },
    });

    console.log(`  Created: ${email} → ${lab.name} (${lab.countryCode})`);
  }

  // ── Create 3 reports per lab (Jan, Feb, Mar 2026) ──────────────
  console.log("\n--- Creating PILA reports (Ene-Mar 2026) ---");

  const months = [1, 2, 3];
  const year = 2026;
  let created = 0;
  let skipped = 0;

  for (const lab of labs) {
    // Find the reporter user for this lab
    const reporter = await prisma.user.findFirst({
      where: { labId: lab.id, isSuperAdmin: false },
    });

    for (const month of months) {
      // Check if report already exists
      const existing = await prisma.pilaReport.findUnique({
        where: { labId_year_month: { labId: lab.id, year, month } },
      });
      if (existing) {
        skipped++;
        continue;
      }

      // Generate realistic random values for each indicator
      const values = indicators.map((ind) => {
        // Different ranges depending on indicator type for realism
        let denominator: number;
        let numerator: number;

        switch (ind.code) {
          case "I-14": // Accidentes laborales (very few events)
            denominator = 28 + Math.floor(Math.random() * 3); // days in month
            numerator = Math.floor(Math.random() * 3); // 0-2 accidents
            break;
          case "I-15": // Rotación del personal (low rate)
            denominator = 30 + Math.floor(Math.random() * 120); // employees
            numerator = Math.floor(Math.random() * 3); // 0-2 desvinculaciones
            break;
          case "I-13": // Ausentismo (moderate rate)
            denominator = 400 + Math.floor(Math.random() * 2000); // workable days
            numerator = Math.floor(denominator * (Math.random() * 0.08)); // up to 8%
            break;
          case "I-17": // Llamadas atendidas (high rate, 80-99%)
            denominator = 500 + Math.floor(Math.random() * 3000);
            numerator = Math.floor(
              denominator * (0.8 + Math.random() * 0.19),
            );
            break;
          case "I-8": // Respuesta de pacientes (varied, 5-40%)
            denominator = 200 + Math.floor(Math.random() * 2000);
            numerator = Math.floor(
              denominator * (0.05 + Math.random() * 0.35),
            );
            break;
          default: // Most indicators: low percentage (0.1-5%)
            denominator = 500 + Math.floor(Math.random() * 5000);
            numerator = Math.floor(denominator * (Math.random() * 0.05));
            break;
        }

        return {
          indicatorId: ind.id,
          numerator,
          denominator,
        };
      });

      await prisma.pilaReport.create({
        data: {
          labId: lab.id,
          year,
          month,
          status: "SUBMITTED",
          submittedById: reporter?.id ?? null,
          submittedAt: new Date(year, month - 1, 15),
          notes: `Reporte ${lab.name} - ${month}/${year}`,
          values: { create: values },
        },
      });

      created++;
    }

    console.log(`  ${lab.name}: 3 reportes (Ene-Mar 2026)`);
  }

  // ── Summary ────────────────────────────────────────────────────
  const totalUsers = await prisma.user.count({
    where: { labId: { not: null }, isSuperAdmin: false },
  });
  const totalReports = await prisma.pilaReport.count({
    where: { year: 2026, status: "SUBMITTED" },
  });

  console.log("\n========================================");
  console.log("Seed complete!");
  console.log(`  Reporter users: ${totalUsers}`);
  console.log(`  Reports created: ${created}, skipped: ${skipped}`);
  console.log(`  Total SUBMITTED reports (2026): ${totalReports}`);
  console.log("\n  All reporters use password: reporter123!");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
