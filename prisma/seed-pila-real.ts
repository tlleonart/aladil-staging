import * as fs from "node:fs";
import * as path from "node:path";
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

// ── CSV file definitions ─────────────────────────────────────────
const CSV_DIR = "C:/Users/tomas/Downloads/PILA";
const CSV_FILES = [
  {
    filename:
      "_Indicadores PILA - Enero 2026 (Respuestas) - Respuestas de formulario 1.csv",
    year: 2026,
    month: 1,
    indicatorCodes: [
      "I-1",
      "I-3",
      "I-5",
      "I-6",
      "I-8",
      "I-9",
      "I-10",
      "I-11",
      "I-13",
      "I-14",
      "I-15",
      "I-17",
    ],
  },
  {
    filename:
      "_Indicadores PILA - Febrero 2026 (Respuestas) - Respuestas de formulario 1.csv",
    year: 2026,
    month: 2,
    indicatorCodes: [
      "I-1",
      "I-3",
      "I-5",
      "I-6",
      "I-8",
      "I-9",
      "I-11",
      "I-13",
      "I-14",
      "I-15",
      "I-17",
    ],
  },
  {
    filename:
      "Indicadores PILA Marzo 2026 (Respuestas) - Respuestas de formulario 1.csv",
    year: 2026,
    month: 3,
    indicatorCodes: [
      "I-1",
      "I-3",
      "I-5",
      "I-6",
      "I-8",
      "I-9",
      "I-11",
      "I-13",
      "I-14",
      "I-15",
      "I-17",
    ],
  },
];

// ── Lab name normalization (CSV names → DB names) ────────────────
const LAB_ALIASES: Record<string, string> = {
  amadita: "Amadita",
  "laboratorio amadita": "Amadita",
  "laboratorios amadita": "Amadita",
  biotest: "Biotest",
  "centro de diagnóstico biotest": "Biotest",
  "centro de diagnostico biotest": "Biotest",
  labin: "LABIN",
  "laboratorios labin": "LABIN",
  cibic: "Cibic",
  "cibic laboratorios": "Cibic",
  lac: "LAC",
  lcm: "Laboratorio Centro Médico Honduras",
  "laboratorios centro médico": "Laboratorio Centro Médico Honduras",
  "laboratorios centro medico": "Laboratorio Centro Médico Honduras",
  "laboratorio medico de referencia": "Laboratorio Médico de Referencia",
  "laboratorio médico de referencia": "Laboratorio Médico de Referencia",
  "laboratorio médico de referencia s.a.s": "Laboratorio Médico de Referencia",
  "laboratorio medico de referencia s.a.s": "Laboratorio Médico de Referencia",
  db: "Diagnóstico do Brasil",
  "grupo db": "Diagnóstico do Brasil",
  "hospital universitario martin dockweiler":
    "Hospital Universitario Martín Dockweiler",
  "hospital universitario martín dockweiler":
    "Hospital Universitario Martín Dockweiler",
  "hospital universitario martin dockewiler":
    "Hospital Universitario Martín Dockweiler",
  "meyer lab": "Meyer Lab",
  "meyer lab sa": "Meyer Lab",
};

// ── CSV parser (handles quoted fields with commas) ───────────────
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current); // last field
  return fields;
}

// ── Value parsing ────────────────────────────────────────────────
const NO_REPORTA_PATTERNS = [
  "no reporta",
  "no se pud", // catches "pudo", "pudieron", "pudimos"
  "no se mid", // catches "midió", "midio" (common misspelling)
  "no aplicable",
  "aún no",
  "aun no",
];

function isNoReporta(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "-") return true;
  const lower = trimmed.toLowerCase();
  return NO_REPORTA_PATTERNS.some((p) => lower.includes(p));
}

function parsePercentageValue(raw: string): number | null {
  let cleaned = raw.trim();
  if (cleaned === "") return null;
  cleaned = cleaned.replace(/%/g, "").trim();
  cleaned = cleaned.replace(/,/g, "."); // European decimal → standard
  const val = Number.parseFloat(cleaned);
  return Number.isNaN(val) ? null : val;
}

// ── Main seed function ───────────────────────────────────────────
async function main() {
  console.log("=== Seeding PILA with REAL data from Martina's CSVs ===\n");

  // 1. Fetch labs from DB
  const labs = await prisma.lab.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const labByName = new Map(labs.map((l) => [l.name, l]));
  console.log(`Found ${labs.length} labs in DB`);

  // 2. Fetch all indicators (including inactive I-10)
  const indicators = await prisma.pilaIndicator.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const indicatorByCode = new Map(indicators.map((i) => [i.code, i]));
  console.log(`Found ${indicators.length} indicators in DB`);

  // 3. Get PILA project and lab_reporter role
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

  // 4. Delete existing PILA test data
  console.log("\n--- Cleaning existing PILA data ---");
  const deletedValues = await prisma.pilaReportValue.deleteMany({});
  console.log(`  Deleted ${deletedValues.count} report values`);
  const deletedReports = await prisma.pilaReport.deleteMany({});
  console.log(`  Deleted ${deletedReports.count} reports`);
  const deletedPublished = await prisma.pilaPublishedReport.deleteMany({});
  console.log(`  Deleted ${deletedPublished.count} published reports`);

  // 5. Create/update reporter users (one per lab)
  console.log("\n--- Ensuring reporter users ---");
  const hashedPassword = await bcrypt.hash("reporter123!", 12);
  const reporterByLabId = new Map<string, string>(); // labId → userId

  for (const lab of labs) {
    const slug = lab.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/(^\.|\.$)/g, "");
    const email = `reporter.${slug}@aladil.org`;

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
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

      // Assign lab_reporter role
      await prisma.userProjectRole.upsert({
        where: {
          userId_projectId: { userId: user.id, projectId: pilaProject.id },
        },
        update: { roleId: labReporterRole.id, isActive: true },
        create: {
          userId: user.id,
          projectId: pilaProject.id,
          roleId: labReporterRole.id,
          isActive: true,
        },
      });

      console.log(`  Created: ${email} → ${lab.name}`);
    } else {
      // Ensure labId is set
      if (!user.labId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { labId: lab.id },
        });
      }
      console.log(`  Exists: ${email} → ${lab.name}`);
    }

    reporterByLabId.set(lab.id, user.id);
  }

  // 6. Parse CSVs and create reports
  console.log("\n--- Importing reports from CSVs ---");
  let totalCreated = 0;

  for (const csvDef of CSV_FILES) {
    const filePath = path.join(CSV_DIR, csvDef.filename);
    if (!fs.existsSync(filePath)) {
      console.error(`  CSV not found: ${filePath}`);
      continue;
    }

    const rawContent = fs.readFileSync(filePath, "utf-8");
    const lines = rawContent.split("\n");

    // Find data rows: lines that start with a date (digit) or start with comma (DB January edge case)
    const headerEndIndex = lines.findIndex(
      (line, idx) =>
        idx > 0 &&
        (line.match(/^\d+\/\d+\/\d+/) || (line.startsWith(",") && idx > 3)),
    );

    console.log(
      `\n  Processing: ${csvDef.month}/${csvDef.year} (${csvDef.indicatorCodes.length} indicators)`,
    );

    for (let i = headerEndIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCSVLine(line);
      if (fields.length < 4) continue; // Skip lines too short

      // Fields: [timestamp, email, labName, ...values]
      const csvLabName = fields[2].trim();
      if (!csvLabName) continue;

      // Resolve lab name
      const normalizedName = csvLabName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
      const dbLabName = LAB_ALIASES[normalizedName];

      if (!dbLabName) {
        console.warn(`    ⚠ Unknown lab: "${csvLabName}" — skipping`);
        continue;
      }

      const lab = labByName.get(dbLabName);
      if (!lab) {
        console.warn(`    ⚠ Lab not in DB: "${dbLabName}" — skipping`);
        continue;
      }

      // Check if DB January with all N/R
      const isDBAllNR =
        dbLabName === "Diagnóstico do Brasil" &&
        csvDef.month === 1 &&
        fields[0].trim() === "";

      // Parse indicator values
      const valueData = fields.slice(3);
      const values: Array<{
        indicatorId: string;
        numerator: number | null;
        denominator: number | null;
        doesNotReport: boolean;
      }> = [];

      for (
        let j = 0;
        j < csvDef.indicatorCodes.length && j < valueData.length;
        j++
      ) {
        const code = csvDef.indicatorCodes[j];
        const indicator = indicatorByCode.get(code);
        if (!indicator) continue;

        const raw = valueData[j].trim();

        if (isDBAllNR || isNoReporta(raw)) {
          values.push({
            indicatorId: indicator.id,
            numerator: null,
            denominator: null,
            doesNotReport: true,
          });
        } else {
          const pctValue = parsePercentageValue(raw);
          values.push({
            indicatorId: indicator.id,
            numerator: pctValue,
            denominator: pctValue != null ? 100 : null,
            doesNotReport: false,
          });
        }
      }

      // For DB January, fill any missing indicators as N/R
      if (isDBAllNR) {
        for (const code of csvDef.indicatorCodes) {
          const indicator = indicatorByCode.get(code);
          if (!indicator) continue;
          if (!values.find((v) => v.indicatorId === indicator.id)) {
            values.push({
              indicatorId: indicator.id,
              numerator: null,
              denominator: null,
              doesNotReport: true,
            });
          }
        }
      }

      const reporterId = reporterByLabId.get(lab.id);
      const submittedAt =
        fields[0].trim() !== ""
          ? parseSubmissionDate(fields[0].trim())
          : new Date(csvDef.year, csvDef.month, 1);

      // Upsert report
      const report = await prisma.pilaReport.upsert({
        where: {
          labId_year_month: {
            labId: lab.id,
            year: csvDef.year,
            month: csvDef.month,
          },
        },
        update: {
          status: "SUBMITTED",
          submittedById: reporterId ?? null,
          submittedAt,
        },
        create: {
          labId: lab.id,
          year: csvDef.year,
          month: csvDef.month,
          status: "SUBMITTED",
          submittedById: reporterId ?? null,
          submittedAt,
        },
      });

      // Clear existing values and insert new ones
      await prisma.pilaReportValue.deleteMany({
        where: { reportId: report.id },
      });
      await prisma.pilaReportValue.createMany({
        data: values.map((v) => ({
          reportId: report.id,
          indicatorId: v.indicatorId,
          numerator: v.numerator,
          denominator: v.denominator,
          doesNotReport: v.doesNotReport,
        })),
      });

      console.log(
        `    ${dbLabName}: ${values.length} values (${values.filter((v) => v.doesNotReport).length} N/R)`,
      );
      totalCreated++;
    }
  }

  // 7. Summary
  const totalReports = await prisma.pilaReport.count();
  const totalValues = await prisma.pilaReportValue.count();
  const totalNR = await prisma.pilaReportValue.count({
    where: { doesNotReport: true },
  });

  console.log("\n========================================");
  console.log("PILA real data seed complete!");
  console.log(`  Reports created: ${totalCreated}`);
  console.log(`  Total reports in DB: ${totalReports}`);
  console.log(`  Total values: ${totalValues}`);
  console.log(`  N/R values: ${totalNR}`);
  console.log("  All reporters use password: reporter123!");
  console.log("========================================");
}

// Helper to parse European date format (d/m/yyyy h:mm:ss)
function parseSubmissionDate(raw: string): Date {
  const [datePart, timePart] = raw.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  if (timePart) {
    const [hours, minutes, seconds] = timePart.split(":").map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }
  return new Date(year, month - 1, day);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
