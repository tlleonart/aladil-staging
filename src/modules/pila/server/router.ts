import * as z from "zod";
import { hasPermission } from "@/modules/core/auth/rbac";
import { prisma } from "@/modules/core/db";
import { ORPCError, protectedProcedure } from "@/modules/core/orpc/server";
import {
  CreatePilaIndicatorSchema,
  CreatePilaReportSchema,
  ListPilaReportsQuerySchema,
  PilaReportQuerySchema,
  UpdatePilaIndicatorSchema,
  UpdatePilaReportSchema,
} from "../schemas";
import {
  sendReportSubmittedToAdmin,
  sendReportSubmittedToReporter,
} from "./email";

// ── Helpers ───────────────────────────────────────────────────────

const withPilaPermission = (permission: string) =>
  protectedProcedure.use(async ({ context, next }) => {
    const allowed = await hasPermission(context.user.id, "PILA", permission);
    if (!allowed) {
      throw new ORPCError("FORBIDDEN", {
        message: `Permiso denegado: ${permission}`,
      });
    }
    return next({ context });
  });

async function getUserLabId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { labId: true },
  });
  if (!user?.labId) {
    throw new ORPCError("FORBIDDEN", {
      message: "No tiene un laboratorio asignado. Contacte al administrador.",
    });
  }
  return user.labId;
}

async function assertCanAccessReport(
  userId: string,
  reportLabId: string,
): Promise<void> {
  const canReadAll = await hasPermission(userId, "PILA", "pila.read_all");
  if (canReadAll) return;
  const userLabId = await getUserLabId(userId);
  if (userLabId !== reportLabId) {
    throw new ORPCError("FORBIDDEN", {
      message: "No tiene acceso a reportes de otros laboratorios.",
    });
  }
}

const reportInclude = {
  lab: { select: { id: true, name: true, countryCode: true } },
  submittedBy: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true, email: true } },
  values: {
    include: {
      indicator: {
        select: { id: true, code: true, name: true, formula: true },
      },
    },
  },
};

// ── Indicator CRUD (admin only) ───────────────────────────────────

const listIndicators = protectedProcedure.handler(async () => {
  return prisma.pilaIndicator.findMany({
    orderBy: { sortOrder: "asc" },
  });
});

const createIndicator = withPilaPermission("pila.manage")
  .input(CreatePilaIndicatorSchema)
  .handler(async ({ input }) => {
    const existing = await prisma.pilaIndicator.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Ya existe un indicador con código ${input.code}`,
      });
    }
    return prisma.pilaIndicator.create({ data: input });
  });

const updateIndicator = withPilaPermission("pila.manage")
  .input(z.object({ id: z.string().uuid(), data: UpdatePilaIndicatorSchema }))
  .handler(async ({ input }) => {
    const existing = await prisma.pilaIndicator.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: "Indicador no encontrado",
      });
    }
    if (input.data.code && input.data.code !== existing.code) {
      const codeExists = await prisma.pilaIndicator.findUnique({
        where: { code: input.data.code },
      });
      if (codeExists) {
        throw new ORPCError("BAD_REQUEST", {
          message: `Ya existe un indicador con código ${input.data.code}`,
        });
      }
    }
    return prisma.pilaIndicator.update({
      where: { id: input.id },
      data: input.data,
    });
  });

const toggleIndicator = withPilaPermission("pila.manage")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const indicator = await prisma.pilaIndicator.findUnique({
      where: { id: input.id },
    });
    if (!indicator) {
      throw new ORPCError("NOT_FOUND", {
        message: "Indicador no encontrado",
      });
    }
    return prisma.pilaIndicator.update({
      where: { id: input.id },
      data: { isActive: !indicator.isActive },
    });
  });

const deleteIndicator = withPilaPermission("pila.manage")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const indicator = await prisma.pilaIndicator.findUnique({
      where: { id: input.id },
    });
    if (!indicator) {
      throw new ORPCError("NOT_FOUND", {
        message: "Indicador no encontrado",
      });
    }
    await prisma.pilaIndicator.delete({ where: { id: input.id } });
    return { success: true };
  });

// ── Lab reporter procedures ───────────────────────────────────────

const myReports = withPilaPermission("pila.read_own")
  .input(z.object({ year: z.number().int().min(2020).max(2100).optional() }))
  .handler(async ({ input, context }) => {
    const labId = await getUserLabId(context.user.id);
    return prisma.pilaReport.findMany({
      where: { labId, ...(input.year && { year: input.year }) },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: reportInclude,
    });
  });

const getById = withPilaPermission("pila.read_own")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const report = await prisma.pilaReport.findUnique({
      where: { id: input.id },
      include: reportInclude,
    });
    if (!report) {
      throw new ORPCError("NOT_FOUND", { message: "Reporte no encontrado" });
    }
    await assertCanAccessReport(context.user.id, report.labId);
    return report;
  });

const create = withPilaPermission("pila.submit")
  .input(CreatePilaReportSchema)
  .handler(async ({ input, context }) => {
    const labId = await getUserLabId(context.user.id);
    const existing = await prisma.pilaReport.findUnique({
      where: {
        labId_year_month: { labId, year: input.year, month: input.month },
      },
    });
    if (existing) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Ya existe un reporte para ${input.month}/${input.year}. Edite el reporte existente.`,
      });
    }
    return prisma.pilaReport.create({
      data: {
        labId,
        submittedById: context.user.id,
        year: input.year,
        month: input.month,
        status: "DRAFT",
        notes: input.notes,
        values: {
          create: input.values.map((v) => ({
            indicatorId: v.indicatorId,
            numerator: v.doesNotReport ? null : (v.numerator ?? null),
            denominator: v.doesNotReport ? null : (v.denominator ?? null),
            doesNotReport: v.doesNotReport ?? false,
          })),
        },
      },
      include: reportInclude,
    });
  });

const update = withPilaPermission("pila.submit")
  .input(z.object({ id: z.string().uuid(), data: UpdatePilaReportSchema }))
  .handler(async ({ input, context }) => {
    const report = await prisma.pilaReport.findUnique({
      where: { id: input.id },
    });
    if (!report) {
      throw new ORPCError("NOT_FOUND", { message: "Reporte no encontrado" });
    }
    await assertCanAccessReport(context.user.id, report.labId);
    if (report.status !== "DRAFT") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Solo se pueden editar reportes en estado borrador.",
      });
    }

    // Upsert each value
    for (const v of input.data.values) {
      await prisma.pilaReportValue.upsert({
        where: {
          reportId_indicatorId: {
            reportId: input.id,
            indicatorId: v.indicatorId,
          },
        },
        update: {
          numerator: v.doesNotReport ? null : (v.numerator ?? null),
          denominator: v.doesNotReport ? null : (v.denominator ?? null),
          doesNotReport: v.doesNotReport ?? false,
        },
        create: {
          reportId: input.id,
          indicatorId: v.indicatorId,
          numerator: v.doesNotReport ? null : (v.numerator ?? null),
          denominator: v.doesNotReport ? null : (v.denominator ?? null),
          doesNotReport: v.doesNotReport ?? false,
        },
      });
    }

    // Update notes
    return prisma.pilaReport.update({
      where: { id: input.id },
      data: { notes: input.data.notes },
      include: reportInclude,
    });
  });

const submit = withPilaPermission("pila.submit")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const report = await prisma.pilaReport.findUnique({
      where: { id: input.id },
    });
    if (!report) {
      throw new ORPCError("NOT_FOUND", { message: "Reporte no encontrado" });
    }
    await assertCanAccessReport(context.user.id, report.labId);
    if (report.status !== "DRAFT") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Este reporte ya fue enviado.",
      });
    }
    const updated = await prisma.pilaReport.update({
      where: { id: input.id },
      data: {
        status: "SUBMITTED",
        submittedById: context.user.id,
        submittedAt: new Date(),
      },
      include: {
        ...reportInclude,
        values: {
          include: {
            indicator: {
              select: { id: true, code: true, name: true, formula: true },
            },
          },
        },
      },
    });

    // Send email notifications (fire-and-forget, don't block the response)
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
    });
    if (user && updated.lab) {
      const emailData = {
        reporterName: user.name || user.email,
        reporterEmail: user.email,
        labName: updated.lab.name,
        year: updated.year,
        month: updated.month,
        values: updated.values.map((v) => ({
          indicatorCode: v.indicator.code,
          indicatorName: v.indicator.name,
          numerator: v.numerator,
          denominator: v.denominator,
          doesNotReport: v.doesNotReport,
        })),
      };
      sendReportSubmittedToReporter(emailData).catch((err) =>
        console.error("[PILA Email] Error sending to reporter:", err),
      );
      sendReportSubmittedToAdmin(emailData).catch((err) =>
        console.error("[PILA Email] Error sending to admin:", err),
      );
    }

    return updated;
  });

// Check if current month report is pending for the user's lab
const pendingStatus = withPilaPermission("pila.read_own").handler(
  async ({ context }) => {
    const labId = await getUserLabId(context.user.id);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const report = await prisma.pilaReport.findUnique({
      where: {
        labId_year_month: {
          labId,
          year: currentYear,
          month: currentMonth,
        },
      },
      select: { id: true, status: true },
    });

    return {
      year: currentYear,
      month: currentMonth,
      hasReport: !!report,
      status: report?.status ?? null,
      reportId: report?.id ?? null,
    };
  },
);

// Check if the anonymous integral report is available for a given month.
// Available only when ALL reports for that month have been REVIEWED.
const integralStatus = withPilaPermission("pila.read_own")
  .input(
    z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
    }),
  )
  .handler(async ({ input }) => {
    const { year, month } = input;

    const reports = await prisma.pilaReport.findMany({
      where: { year, month },
      select: { status: true },
    });

    const total = reports.length;
    const reviewed = reports.filter((r) => r.status === "REVIEWED").length;

    return {
      year,
      month,
      available: total > 0 && reviewed === total,
      total,
      reviewed,
    };
  });

// ── Admin procedures ──────────────────────────────────────────────

const listAll = withPilaPermission("pila.read_all")
  .input(ListPilaReportsQuerySchema)
  .handler(async ({ input }) => {
    return prisma.pilaReport.findMany({
      where: {
        ...(input.year && { year: input.year }),
        ...(input.month && { month: input.month }),
        ...(input.status && { status: input.status }),
        ...(input.labId && { labId: input.labId }),
      },
      orderBy: [{ year: "desc" }, { month: "desc" }, { lab: { name: "asc" } }],
      include: reportInclude,
    });
  });

const remove = withPilaPermission("pila.manage")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const report = await prisma.pilaReport.findUnique({
      where: { id: input.id },
    });
    if (!report) {
      throw new ORPCError("NOT_FOUND", { message: "Reporte no encontrado" });
    }
    await prisma.pilaReport.delete({ where: { id: input.id } });
    return { success: true };
  });

const reopen = withPilaPermission("pila.manage")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const report = await prisma.pilaReport.findUnique({
      where: { id: input.id },
    });
    if (!report) {
      throw new ORPCError("NOT_FOUND", { message: "Reporte no encontrado" });
    }
    if (report.status === "DRAFT") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Este reporte ya está en borrador.",
      });
    }
    return prisma.pilaReport.update({
      where: { id: input.id },
      data: {
        status: "DRAFT",
        submittedAt: null,
        reviewedAt: null,
        reviewedById: null,
      },
      include: reportInclude,
    });
  });

// Mark report as reviewed by admin
const markReviewed = withPilaPermission("pila.manage")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const report = await prisma.pilaReport.findUnique({
      where: { id: input.id },
    });
    if (!report) {
      throw new ORPCError("NOT_FOUND", { message: "Reporte no encontrado" });
    }
    if (report.status === "DRAFT") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Solo se pueden marcar como revisados reportes enviados.",
      });
    }
    return prisma.pilaReport.update({
      where: { id: input.id },
      data: {
        status: "REVIEWED",
        reviewedById: context.user.id,
        reviewedAt: new Date(),
      },
      include: reportInclude,
    });
  });

// Generate aggregated report data for a date range
// Returns indicator averages across all labs (anonymous) or for a specific lab
// pila.read_own users can only access anonymous reports (no labId, lab names stripped)
const generateReport = withPilaPermission("pila.read_own")
  .input(PilaReportQuerySchema)
  .handler(async ({ input, context }) => {
    const { yearFrom, monthFrom, yearTo, monthTo, labId } = input;
    const canReadAll = await hasPermission(
      context.user.id,
      "PILA",
      "pila.read_all",
    );

    // Non-admin users can only generate anonymous reports (no labId)
    if (labId && !canReadAll) {
      throw new ORPCError("FORBIDDEN", {
        message: "No tiene permiso para generar informes por laboratorio.",
      });
    }

    // Build period filter: from (yearFrom, monthFrom) to (yearTo, monthTo)
    const reports = await prisma.pilaReport.findMany({
      where: {
        status: { in: ["SUBMITTED", "REVIEWED"] },
        ...(labId && { labId }),
        OR: [
          // Same year range
          {
            year: { gt: yearFrom, lt: yearTo },
          },
          // Start year, from startMonth onwards
          {
            year: yearFrom,
            month: { gte: monthFrom },
            ...(yearFrom === yearTo && {
              month: { gte: monthFrom, lte: monthTo },
            }),
          },
          // End year, up to endMonth (only if different from start year)
          ...(yearFrom !== yearTo
            ? [{ year: yearTo, month: { lte: monthTo } }]
            : []),
        ],
      },
      include: {
        lab: { select: { id: true, name: true, countryCode: true } },
        values: {
          include: {
            indicator: {
              select: {
                id: true,
                code: true,
                name: true,
                formula: true,
                sortOrder: true,
              },
            },
          },
        },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    // Get active indicators for column headers + chart metadata
    const indicators = await prisma.pilaIndicator.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        formula: true,
        numeratorLabel: true,
        denominatorLabel: true,
        considerations: true,
        exclusions: true,
      },
    });

    // Strip lab names for non-admin users (anonymous report)
    if (!canReadAll) {
      const anonymized = reports.map((r) => ({
        ...r,
        lab: r.lab ? { id: r.lab.id, name: "", countryCode: "" } : null,
      }));
      return { reports: anonymized, indicators };
    }

    return { reports, indicators };
  });

// ── Published reports (saved PDFs for reporters to download) ──────

// Admin saves a generated report to Supabase Storage
const publishReport = withPilaPermission("pila.manage")
  .input(
    z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
      storagePath: z.string().min(1),
      filename: z.string().min(1),
      sizeBytes: z.number().int().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    // Upsert: if a report for this month already exists, replace it
    return prisma.pilaPublishedReport.upsert({
      where: {
        year_month: { year: input.year, month: input.month },
      },
      update: {
        storagePath: input.storagePath,
        filename: input.filename,
        sizeBytes: input.sizeBytes ?? null,
        publishedById: context.user.id,
      },
      create: {
        year: input.year,
        month: input.month,
        storagePath: input.storagePath,
        filename: input.filename,
        sizeBytes: input.sizeBytes ?? null,
        publishedById: context.user.id,
      },
    });
  });

// List published reports (any authenticated PILA user can see)
const listPublished = withPilaPermission("pila.read_own")
  .input(
    z.object({
      year: z.number().int().min(2020).max(2100).optional(),
    }),
  )
  .handler(async ({ input }) => {
    return prisma.pilaPublishedReport.findMany({
      where: input.year ? { year: input.year } : undefined,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        publishedBy: { select: { name: true } },
      },
    });
  });

// Admin deletes a published report
const unpublishReport = withPilaPermission("pila.manage")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const report = await prisma.pilaPublishedReport.findUnique({
      where: { id: input.id },
    });
    if (!report) {
      throw new ORPCError("NOT_FOUND", {
        message: "Informe publicado no encontrado",
      });
    }
    await prisma.pilaPublishedReport.delete({ where: { id: input.id } });
    return { success: true, storagePath: report.storagePath };
  });

// ── Router export ─────────────────────────────────────────────────

export const pilaRouter = {
  // Indicators (admin manages, reporters read)
  listIndicators,
  createIndicator,
  updateIndicator,
  toggleIndicator,
  deleteIndicator,
  // Lab reporter
  myReports,
  getById,
  create,
  update,
  submit,
  pendingStatus,
  integralStatus,
  // Admin
  listAll,
  remove,
  reopen,
  markReviewed,
  generateReport,
  // Published reports
  publishReport,
  listPublished,
  unpublishReport,
};
