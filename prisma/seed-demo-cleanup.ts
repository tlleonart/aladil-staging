/**
 * DEMO CLEANUP — Removes all demo data created by seed-demo.ts
 *
 * Deletes (in order):
 *   1. PilaReportValues (cascade via report)
 *   2. PilaReports for Testing Lab
 *   3. UserProjectRole entries for the reporter
 *   4. Account (Better Auth credential)
 *   5. User: reporter.testing-lab@aladil.org
 *   6. Lab: "Testing Lab"
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const DEMO_EMAIL = "reporter.testing-lab@aladil.org";
const DEMO_LAB_NAME = "Testing Lab";

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
  console.log("Cleaning up DEMO data...\n");

  // ── 1. Find the demo user ─────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });

  if (user) {
    // Delete PILA reports (values cascade automatically)
    const deletedReports = await prisma.pilaReport.deleteMany({
      where: { submittedById: user.id },
    });
    console.log(`Deleted ${deletedReports.count} PILA reports`);

    // Delete role assignments
    const deletedRoles = await prisma.userProjectRole.deleteMany({
      where: { userId: user.id },
    });
    console.log(`Deleted ${deletedRoles.count} role assignments`);

    // Delete Better Auth account
    const deletedAccounts = await prisma.account.deleteMany({
      where: { userId: user.id },
    });
    console.log(`Deleted ${deletedAccounts.count} auth accounts`);

    // Delete sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId: user.id },
    });
    console.log(`Deleted ${deletedSessions.count} sessions`);

    // Delete user
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`Deleted user: ${DEMO_EMAIL}`);
  } else {
    console.log(`User ${DEMO_EMAIL} not found — skipping user cleanup`);
  }

  // ── 2. Find and delete the demo lab ────────────────────────────
  const lab = await prisma.lab.findFirst({
    where: { name: DEMO_LAB_NAME },
  });

  if (lab) {
    // Delete any remaining reports for this lab (safety net)
    const remainingReports = await prisma.pilaReport.deleteMany({
      where: { labId: lab.id },
    });
    if (remainingReports.count > 0) {
      console.log(
        `Deleted ${remainingReports.count} additional reports for lab`,
      );
    }

    await prisma.lab.delete({ where: { id: lab.id } });
    console.log(`Deleted lab: ${DEMO_LAB_NAME} (${lab.id})`);
  } else {
    console.log(`Lab "${DEMO_LAB_NAME}" not found — skipping lab cleanup`);
  }

  console.log("\n========================================");
  console.log("DEMO cleanup complete!");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
