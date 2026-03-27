import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // Simulate what generateReport does for March 2026
  const yearFrom = 2026, monthFrom = 3, yearTo = 2026, monthTo = 3;

  const reports = await prisma.pilaReport.findMany({
    where: {
      status: { in: ["SUBMITTED", "REVIEWED"] },
      OR: [
        { year: { gt: yearFrom, lt: yearTo } },
        {
          year: yearFrom,
          month: { gte: monthFrom },
          ...(yearFrom === yearTo && {
            month: { gte: monthFrom, lte: monthTo },
          }),
        },
        ...(yearFrom !== yearTo
          ? [{ year: yearTo, month: { lte: monthTo } }]
          : []),
      ],
    },
    include: {
      lab: { select: { id: true, name: true, countryCode: true } },
      values: {
        include: {
          indicator: { select: { id: true, code: true, name: true, formula: true, sortOrder: true } },
        },
      },
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  console.log(`Reports found for ${monthFrom}/${yearFrom} to ${monthTo}/${yearTo}: ${reports.length}`);
  for (const r of reports) {
    console.log(`  ${r.lab?.name} - ${r.month}/${r.year} - values: ${r.values.length}`);
  }

  // Also test range query (Jan-Mar 2026)
  const yearFrom2 = 2026, monthFrom2 = 1, yearTo2 = 2026, monthTo2 = 3;
  const reports2 = await prisma.pilaReport.findMany({
    where: {
      status: { in: ["SUBMITTED", "REVIEWED"] },
      OR: [
        { year: { gt: yearFrom2, lt: yearTo2 } },
        {
          year: yearFrom2,
          month: { gte: monthFrom2 },
          ...(yearFrom2 === yearTo2 && {
            month: { gte: monthFrom2, lte: monthTo2 },
          }),
        },
        ...(yearFrom2 !== yearTo2
          ? [{ year: yearTo2, month: { lte: monthTo2 } }]
          : []),
      ],
    },
  });
  console.log(`\nReports found for ${monthFrom2}/${yearFrom2} to ${monthTo2}/${yearTo2}: ${reports2.length}`);
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
