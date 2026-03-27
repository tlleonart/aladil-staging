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

async function main() {
  console.log("=== PILA Diagnostic ===\n");

  // 1. Check PILA indicators
  const indicators = await prisma.pilaIndicator.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, code: true, name: true },
  });
  console.log(`Active indicators: ${indicators.length}`);
  for (const ind of indicators) {
    console.log(`  ${ind.code}: ${ind.name}`);
  }

  // 2. Check PILA reports
  const allReports = await prisma.pilaReport.findMany({
    include: {
      lab: { select: { name: true } },
      values: { select: { indicatorId: true, numerator: true, denominator: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  console.log(`\nTotal PILA reports: ${allReports.length}`);
  for (const r of allReports) {
    console.log(`  ${r.lab?.name} - ${r.month}/${r.year} - Status: ${r.status} - Values: ${r.values.length}`);
  }

  // 3. Check sessions & test auth
  const sessions = await prisma.session.findMany({
    include: { user: { select: { email: true, isSuperAdmin: true } } },
    take: 5,
    orderBy: { expiresAt: "desc" },
  });
  console.log(`\nActive sessions: ${sessions.length}`);
  for (const s of sessions) {
    console.log(`  ${s.user.email} (superAdmin: ${s.user.isSuperAdmin}, token: ${s.token.substring(0, 10)}..., expires: ${s.expiresAt})`);
  }

  // 4. Try to call generateReport via HTTP using session token
  if (sessions.length > 0) {
    const token = sessions[0].token;
    console.log(`\nTesting generateReport endpoint with token...`);
    try {
      const res = await fetch("http://localhost:3000/api/rpc/pila/generateReport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": `better-auth.session_token=${token}`,
        },
        body: JSON.stringify({ json: { yearFrom: 2026, monthFrom: 1, yearTo: 2026, monthTo: 3 } }),
      });
      const body = await res.text();
      console.log(`  Status: ${res.status}`);
      console.log(`  Response: ${body.substring(0, 500)}`);
    } catch (err) {
      console.log(`  Error: ${err}`);
    }
  }

  // 5. Check user PILA permissions
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@aladil.org" },
    include: {
      memberships: {
        include: {
          project: { select: { key: true } },
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });
  if (adminUser) {
    console.log(`\nAdmin user: ${adminUser.email} (superAdmin: ${adminUser.isSuperAdmin})`);
    console.log(`Memberships: ${adminUser.memberships.length}`);
    for (const m of adminUser.memberships) {
      const perms = m.role.permissions.map((p) => p.permission.key);
      console.log(`  Project: ${m.project.key}, Role: ${m.role.key}, Perms: ${perms.join(", ")}`);
    }
  }

  console.log("\n=== Done ===");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
