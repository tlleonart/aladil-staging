import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("Seeding PILA test reports...\n");

  // Get labs and indicators
  const labs = await prisma.lab.findMany({ where: { isActive: true }, take: 5 });
  const indicators = await prisma.pilaIndicator.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const adminUser = await prisma.user.findFirst({
    where: { isSuperAdmin: true },
  });

  if (!adminUser) {
    console.log("No admin user found!");
    return;
  }

  console.log(`Labs: ${labs.length}`);
  console.log(`Indicators: ${indicators.length}`);
  console.log(`Admin: ${adminUser.email}\n`);

  // Create SUBMITTED reports for Jan, Feb, March 2026 for multiple labs
  const months = [1, 2, 3];

  for (const lab of labs.slice(0, 3)) {
    for (const month of months) {
      // Check if report already exists
      const existing = await prisma.pilaReport.findUnique({
        where: {
          labId_year_month: { labId: lab.id, year: 2026, month },
        },
      });

      if (existing) {
        // Update to SUBMITTED if DRAFT
        if (existing.status === "DRAFT") {
          await prisma.pilaReport.update({
            where: { id: existing.id },
            data: {
              status: "SUBMITTED",
              submittedAt: new Date(),
              submittedById: adminUser.id,
            },
          });
          console.log(`Updated existing report: ${lab.name} ${month}/2026 → SUBMITTED`);
        } else {
          console.log(`Skipping existing report: ${lab.name} ${month}/2026 (${existing.status})`);
        }
        continue;
      }

      // Generate random values for each indicator
      const report = await prisma.pilaReport.create({
        data: {
          labId: lab.id,
          year: 2026,
          month,
          status: "SUBMITTED",
          submittedById: adminUser.id,
          submittedAt: new Date(),
          notes: `Reporte de prueba ${month}/2026`,
          values: {
            create: indicators.map((ind) => {
              const denominator = Math.floor(Math.random() * 5000) + 500;
              const numerator = Math.floor(Math.random() * denominator * 0.1);
              return {
                indicatorId: ind.id,
                numerator,
                denominator,
              };
            }),
          },
        },
      });
      console.log(`Created: ${lab.name} ${month}/2026 → SUBMITTED (${report.id})`);
    }
  }

  // Verify
  const total = await prisma.pilaReport.count({ where: { status: "SUBMITTED" } });
  console.log(`\nTotal SUBMITTED reports: ${total}`);
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
