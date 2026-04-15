/**
 * DEMO SEED — Testing Lab + Reporter + PILA Reports (Ene-Mar 2026)
 *
 * Creates:
 *   - Lab: "Testing Lab" (countryCode: "XX")
 *   - User: reporter.testing-lab@aladil.org (password: reporter123!)
 *   - 3 PILA reports (Jan, Feb, Mar 2026) with realistic fake data
 *
 * Cleanup: pnpm db:demo-cleanup
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const DEMO_EMAIL = "reporter.testing-lab@aladil.org";
const DEMO_LAB_NAME = "Testing Lab";
const DEMO_PASSWORD = "reporter123!";

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
  console.log("🧪 Seeding DEMO data (Testing Lab)...\n");

  // ── 1. Create Testing Lab ──────────────────────────────────────
  const existingLab = await prisma.lab.findFirst({
    where: { name: DEMO_LAB_NAME },
  });

  const lab = existingLab
    ? existingLab
    : await prisma.lab.create({
        data: {
          name: DEMO_LAB_NAME,
          countryCode: "XX",
          city: "Demo City",
          websiteUrl: null,
          isActive: true,
          sortOrder: 999, // Last in the list
        },
      });

  console.log(
    `Lab: ${lab.name} (${lab.id}) ${existingLab ? "[already existed]" : "[created]"}`,
  );

  // ── 2. Fetch RBAC prerequisites ────────────────────────────────
  const pilaProject = await prisma.project.findUnique({
    where: { key: "PILA" },
  });
  if (!pilaProject) {
    console.error("PILA project not found. Run pnpm db:seed first.");
    return;
  }

  const intranetProject = await prisma.project.findUnique({
    where: { key: "INTRANET" },
  });
  if (!intranetProject) {
    console.error("INTRANET project not found. Run pnpm db:seed first.");
    return;
  }

  const labReporterRole = await prisma.role.findUnique({
    where: {
      projectId_key: { projectId: pilaProject.id, key: "lab_reporter" },
    },
  });
  if (!labReporterRole) {
    console.error("lab_reporter role not found. Run pnpm db:seed first.");
    return;
  }

  const intranetReporterRole = await prisma.role.findUnique({
    where: {
      projectId_key: { projectId: intranetProject.id, key: "reporter" },
    },
  });
  if (!intranetReporterRole) {
    console.error(
      "INTRANET reporter role not found. Run pnpm db:seed-roles first.",
    );
    return;
  }

  // ── 3. Create reporter user ────────────────────────────────────
  const existingUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });

  let user = existingUser;
  if (!user) {
    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 12);

    user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        name: `Reportador ${DEMO_LAB_NAME}`,
        emailVerified: true,
        isActive: true,
        isSuperAdmin: false,
        labId: lab.id,
      },
    });

    // Better Auth credential account
    await prisma.account.create({
      data: {
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hashedPassword,
      },
    });

    // PILA lab_reporter role
    await prisma.userProjectRole.create({
      data: {
        userId: user.id,
        projectId: pilaProject.id,
        roleId: labReporterRole.id,
        isActive: true,
      },
    });

    // INTRANET reporter role (for sidebar filtering)
    await prisma.userProjectRole.create({
      data: {
        userId: user.id,
        projectId: intranetProject.id,
        roleId: intranetReporterRole.id,
        isActive: true,
      },
    });

    console.log(`User: ${user.email} [created]`);
  } else {
    console.log(`User: ${user.email} [already existed]`);
  }

  // ── 4. Fetch active indicators ─────────────────────────────────
  const indicators = await prisma.pilaIndicator.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log(`Found ${indicators.length} active indicators`);

  // ── 5. Create PILA reports (Ene, Feb, Mar 2026) ────────────────
  console.log("\n--- Creating PILA reports ---");

  const months = [1, 2, 3];
  const year = 2026;
  let created = 0;

  for (const month of months) {
    const existing = await prisma.pilaReport.findUnique({
      where: { labId_year_month: { labId: lab.id, year, month } },
    });
    if (existing) {
      console.log(
        `  ${month}/${year}: already exists (${existing.status}) — skipped`,
      );
      continue;
    }

    const values = indicators.map((ind) => {
      let denominator: number;
      let numerator: number;

      switch (ind.code) {
        case "I-14": // Accidentes laborales (very few events)
          denominator = 28 + Math.floor(Math.random() * 3);
          numerator = Math.floor(Math.random() * 2); // 0-1
          break;
        case "I-15": // Rotación del personal (low rate)
          denominator = 45 + Math.floor(Math.random() * 20);
          numerator = Math.floor(Math.random() * 2); // 0-1
          break;
        case "I-13": // Ausentismo (moderate rate)
          denominator = 800 + Math.floor(Math.random() * 400);
          numerator = Math.floor(denominator * (0.02 + Math.random() * 0.05));
          break;
        case "I-17": // Llamadas atendidas (high rate, 85-98%)
          denominator = 1200 + Math.floor(Math.random() * 800);
          numerator = Math.floor(
            denominator * (0.85 + Math.random() * 0.13),
          );
          break;
        case "I-8": // Respuesta de pacientes (10-30%)
          denominator = 600 + Math.floor(Math.random() * 400);
          numerator = Math.floor(
            denominator * (0.1 + Math.random() * 0.2),
          );
          break;
        case "I-1": // Error de ingreso (very low, 0.1-1%)
          denominator = 3000 + Math.floor(Math.random() * 2000);
          numerator = Math.floor(denominator * (0.001 + Math.random() * 0.009));
          break;
        case "I-3": // Urocultivos contaminados (1-4%)
          denominator = 400 + Math.floor(Math.random() * 300);
          numerator = Math.floor(denominator * (0.01 + Math.random() * 0.03));
          break;
        case "I-5": // Rechazo de muestras (0.5-3%)
          denominator = 4000 + Math.floor(Math.random() * 2000);
          numerator = Math.floor(denominator * (0.005 + Math.random() * 0.025));
          break;
        case "I-9": // Informes demorados (1-5%)
          denominator = 3500 + Math.floor(Math.random() * 1500);
          numerator = Math.floor(denominator * (0.01 + Math.random() * 0.04));
          break;
        default: // Other indicators: 0.5-4%
          denominator = 1000 + Math.floor(Math.random() * 3000);
          numerator = Math.floor(denominator * (0.005 + Math.random() * 0.035));
          break;
      }

      return {
        indicatorId: ind.id,
        numerator,
        denominator,
      };
    });

    const monthNames = [
      "",
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    await prisma.pilaReport.create({
      data: {
        labId: lab.id,
        year,
        month,
        status: "SUBMITTED",
        submittedById: user.id,
        submittedAt: new Date(year, month - 1, 15),
        notes: `[DEMO] Reporte ${monthNames[month]} ${year} — Testing Lab`,
        values: { create: values },
      },
    });

    console.log(`  ${monthNames[month]} ${year}: created (SUBMITTED)`);
    created++;
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log("\n========================================");
  console.log("DEMO seed complete!");
  console.log(`  Lab:      ${DEMO_LAB_NAME} (id: ${lab.id})`);
  console.log(`  User:     ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Reports:  ${created} created (Ene-Mar 2026)`);
  console.log("\n  Cleanup:  pnpm db:demo-cleanup");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
