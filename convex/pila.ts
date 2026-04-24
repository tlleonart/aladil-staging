import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";
import { requireAuth, requirePermission } from "./authHelpers";
import { computePilaLabNumbers } from "./labs";
import { checkPermission } from "./rbac";

async function getUserLabId(
  ctx: QueryCtx,
  userId: Id<"users">,
): Promise<Id<"labs">> {
  const user = await ctx.db.get(userId);
  if (!user?.labId) {
    throw new Error(
      "No tiene un laboratorio asignado. Contacte al administrador.",
    );
  }
  return user.labId;
}

async function assertCanAccessReport(
  ctx: QueryCtx,
  userId: Id<"users">,
  reportLabId: Id<"labs">,
): Promise<void> {
  const canReadAll = await checkPermission(
    ctx,
    userId,
    "PILA",
    "pila.read_all",
  );
  if (canReadAll) return;
  const userLabId = await getUserLabId(ctx, userId);
  if (userLabId !== reportLabId) {
    throw new Error("No tiene acceso a reportes de otros laboratorios.");
  }
}

async function serializeReport(
  ctx: QueryCtx,
  r: Doc<"pilaReports">,
  opts: { includeValues?: boolean } = {},
) {
  const lab = await ctx.db.get(r.labId);
  const submittedBy = r.submittedById
    ? await ctx.db.get(r.submittedById)
    : null;
  const reviewedBy = r.reviewedById ? await ctx.db.get(r.reviewedById) : null;
  const valueRows = opts.includeValues
    ? await ctx.db
        .query("pilaReportValues")
        .withIndex("by_reportId", (q) => q.eq("reportId", r._id))
        .collect()
    : [];
  const values = opts.includeValues
    ? await Promise.all(
        valueRows.map(async (v) => {
          const indicator = await ctx.db.get(v.indicatorId);
          return {
            id: v._id,
            numerator: v.numerator ?? null,
            denominator: v.denominator ?? null,
            doesNotReport: v.doesNotReport,
            indicator: indicator
              ? {
                  id: indicator._id,
                  code: indicator.code,
                  name: indicator.name,
                  formula: indicator.formula,
                }
              : null,
          };
        }),
      )
    : undefined;
  return {
    id: r._id,
    labId: r.labId,
    year: r.year,
    month: r.month,
    status: r.status,
    notes: r.notes ?? null,
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
    submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : null,
    reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : null,
    lab: lab
      ? { id: lab._id, name: lab.name, countryCode: lab.countryCode }
      : null,
    submittedBy: submittedBy
      ? {
          id: submittedBy._id,
          name: submittedBy.name,
          email: submittedBy.email,
        }
      : null,
    reviewedBy: reviewedBy
      ? { id: reviewedBy._id, name: reviewedBy.name, email: reviewedBy.email }
      : null,
    values,
  };
}

// ─── Indicators ──────────────────────────────────────────────────────
export const listIndicators = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const rows = await ctx.db.query("pilaIndicators").collect();
    rows.sort((a, b) => a.sortOrder - b.sortOrder);
    return rows.map((r) => ({ ...r, id: r._id }));
  },
});

export const createIndicator = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    formula: v.string(),
    numeratorLabel: v.string(),
    denominatorLabel: v.string(),
    considerations: v.optional(v.union(v.string(), v.null())),
    exclusions: v.optional(v.union(v.string(), v.null())),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "PILA", "pila.manage");
    const existing = await ctx.db
      .query("pilaIndicators")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (existing)
      throw new Error(`Ya existe un indicador con código ${args.code}`);
    const now = Date.now();
    const id = await ctx.db.insert("pilaIndicators", {
      ...args,
      considerations: args.considerations ?? undefined,
      exclusions: args.exclusions ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
    const r = await ctx.db.get(id);
    return { ...r, id: r!._id };
  },
});

export const updateIndicator = mutation({
  args: {
    id: v.id("pilaIndicators"),
    data: v.object({
      code: v.optional(v.string()),
      name: v.optional(v.string()),
      formula: v.optional(v.string()),
      numeratorLabel: v.optional(v.string()),
      denominatorLabel: v.optional(v.string()),
      considerations: v.optional(v.union(v.string(), v.null())),
      exclusions: v.optional(v.union(v.string(), v.null())),
      sortOrder: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { id, data }) => {
    await requirePermission(ctx, "PILA", "pila.manage");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Indicador no encontrado");
    if (data.code && data.code !== existing.code) {
      const dup = await ctx.db
        .query("pilaIndicators")
        .withIndex("by_code", (q) => q.eq("code", data.code as string))
        .unique();
      if (dup)
        throw new Error(`Ya existe un indicador con código ${data.code}`);
    }
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) patch[k] = v === null ? undefined : v;
    }
    await ctx.db.patch(id, patch);
    const r = await ctx.db.get(id);
    return { ...r, id: r!._id };
  },
});

export const toggleIndicator = mutation({
  args: { id: v.id("pilaIndicators") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "PILA", "pila.manage");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Indicador no encontrado");
    await ctx.db.patch(id, {
      isActive: !existing.isActive,
      updatedAt: Date.now(),
    });
    const r = await ctx.db.get(id);
    return { ...r, id: r!._id };
  },
});

export const deleteIndicator = mutation({
  args: { id: v.id("pilaIndicators") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "PILA", "pila.manage");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Indicador no encontrado");
    await ctx.db.delete(id);
    return { success: true };
  },
});

// ─── Lab reporter ────────────────────────────────────────────────────
export const myReports = query({
  args: { year: v.optional(v.number()) },
  handler: async (ctx, { year }) => {
    const userId = await requirePermission(ctx, "PILA", "pila.read_own");
    const labId = await getUserLabId(ctx, userId);
    let rows = await ctx.db
      .query("pilaReports")
      .withIndex("by_labId_year", (q) => q.eq("labId", labId))
      .collect();
    if (year !== undefined) rows = rows.filter((r) => r.year === year);
    rows.sort((a, b) => b.year - a.year || b.month - a.month);
    return Promise.all(
      rows.map((r) => serializeReport(ctx, r, { includeValues: true })),
    );
  },
});

export const getReportById = query({
  args: { id: v.id("pilaReports") },
  handler: async (ctx, { id }) => {
    const userId = await requirePermission(ctx, "PILA", "pila.read_own");
    const r = await ctx.db.get(id);
    if (!r) throw new Error("Reporte no encontrado");
    await assertCanAccessReport(ctx, userId, r.labId);
    return await serializeReport(ctx, r, { includeValues: true });
  },
});

export const createReport = mutation({
  args: {
    year: v.number(),
    month: v.number(),
    notes: v.optional(v.union(v.string(), v.null())),
    values: v.array(
      v.object({
        indicatorId: v.id("pilaIndicators"),
        numerator: v.optional(v.union(v.number(), v.null())),
        denominator: v.optional(v.union(v.number(), v.null())),
        doesNotReport: v.optional(v.boolean()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requirePermission(ctx, "PILA", "pila.submit");
    const labId = await getUserLabId(ctx, userId);
    const dup = await ctx.db
      .query("pilaReports")
      .withIndex("by_lab_year_month", (q) =>
        q.eq("labId", labId).eq("year", args.year).eq("month", args.month),
      )
      .unique();
    if (dup) {
      throw new Error(
        `Ya existe un reporte para ${args.month}/${args.year}. Edite el reporte existente.`,
      );
    }
    const now = Date.now();
    const reportId = await ctx.db.insert("pilaReports", {
      labId,
      submittedById: userId,
      year: args.year,
      month: args.month,
      status: "DRAFT",
      notes: args.notes ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
    for (const v of args.values) {
      await ctx.db.insert("pilaReportValues", {
        reportId,
        indicatorId: v.indicatorId,
        numerator: v.doesNotReport ? undefined : (v.numerator ?? undefined),
        denominator: v.doesNotReport ? undefined : (v.denominator ?? undefined),
        doesNotReport: v.doesNotReport ?? false,
      });
    }
    const r = await ctx.db.get(reportId);
    return await serializeReport(ctx, r!, { includeValues: true });
  },
});

export const updateReport = mutation({
  args: {
    id: v.id("pilaReports"),
    data: v.object({
      notes: v.optional(v.union(v.string(), v.null())),
      values: v.array(
        v.object({
          indicatorId: v.id("pilaIndicators"),
          numerator: v.optional(v.union(v.number(), v.null())),
          denominator: v.optional(v.union(v.number(), v.null())),
          doesNotReport: v.optional(v.boolean()),
        }),
      ),
    }),
  },
  handler: async (ctx, { id, data }) => {
    const userId = await requirePermission(ctx, "PILA", "pila.submit");
    const report = await ctx.db.get(id);
    if (!report) throw new Error("Reporte no encontrado");
    await assertCanAccessReport(ctx, userId, report.labId);
    if (report.status !== "DRAFT") {
      throw new Error("Solo se pueden editar reportes en estado borrador.");
    }
    for (const v of data.values) {
      const existing = await ctx.db
        .query("pilaReportValues")
        .withIndex("by_report_indicator", (q) =>
          q.eq("reportId", id).eq("indicatorId", v.indicatorId),
        )
        .unique();
      const payload = {
        reportId: id,
        indicatorId: v.indicatorId,
        numerator: v.doesNotReport ? undefined : (v.numerator ?? undefined),
        denominator: v.doesNotReport ? undefined : (v.denominator ?? undefined),
        doesNotReport: v.doesNotReport ?? false,
      };
      if (existing) {
        await ctx.db.patch(existing._id, payload);
      } else {
        await ctx.db.insert("pilaReportValues", payload);
      }
    }
    await ctx.db.patch(id, {
      notes: data.notes ?? undefined,
      updatedAt: Date.now(),
    });
    const r = await ctx.db.get(id);
    return await serializeReport(ctx, r!, { includeValues: true });
  },
});

export const submitReport = mutation({
  args: { id: v.id("pilaReports") },
  handler: async (ctx, { id }) => {
    const userId = await requirePermission(ctx, "PILA", "pila.submit");
    const report = await ctx.db.get(id);
    if (!report) throw new Error("Reporte no encontrado");
    await assertCanAccessReport(ctx, userId, report.labId);
    if (report.status !== "DRAFT") {
      throw new Error("Este reporte ya fue enviado.");
    }
    await ctx.db.patch(id, {
      status: "SUBMITTED",
      submittedById: userId,
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    });
    const r = await ctx.db.get(id);
    return await serializeReport(ctx, r!, { includeValues: true });
  },
});

export const pendingStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requirePermission(ctx, "PILA", "pila.read_own");
    const labId = await getUserLabId(ctx, userId);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const report = await ctx.db
      .query("pilaReports")
      .withIndex("by_lab_year_month", (q) =>
        q.eq("labId", labId).eq("year", year).eq("month", month),
      )
      .unique();
    return {
      year,
      month,
      hasReport: !!report,
      status: report?.status ?? null,
      reportId: report?._id ?? null,
    };
  },
});

export const integralStatus = query({
  args: { year: v.number(), month: v.number() },
  handler: async (ctx, { year, month }) => {
    await requirePermission(ctx, "PILA", "pila.read_own");
    const reports = await ctx.db
      .query("pilaReports")
      .withIndex("by_year_month", (q) => q.eq("year", year).eq("month", month))
      .collect();
    const total = reports.length;
    const reviewed = reports.filter((r) => r.status === "REVIEWED").length;
    return {
      year,
      month,
      available: total > 0 && reviewed === total,
      total,
      reviewed,
    };
  },
});

// ─── Admin ───────────────────────────────────────────────────────────
export const listAll = query({
  args: {
    year: v.optional(v.number()),
    month: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("DRAFT"),
        v.literal("SUBMITTED"),
        v.literal("REVIEWED"),
      ),
    ),
    labId: v.optional(v.id("labs")),
  },
  handler: async (ctx, { year, month, status, labId }) => {
    await requirePermission(ctx, "PILA", "pila.read_all");
    let rows = await ctx.db.query("pilaReports").collect();
    if (year !== undefined) rows = rows.filter((r) => r.year === year);
    if (month !== undefined) rows = rows.filter((r) => r.month === month);
    if (status) rows = rows.filter((r) => r.status === status);
    if (labId) rows = rows.filter((r) => r.labId === labId);
    rows.sort((a, b) => b.year - a.year || b.month - a.month);
    return Promise.all(
      rows.map((r) => serializeReport(ctx, r, { includeValues: true })),
    );
  },
});

export const removeReport = mutation({
  args: { id: v.id("pilaReports") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "PILA", "pila.manage");
    const report = await ctx.db.get(id);
    if (!report) throw new Error("Reporte no encontrado");
    const vs = await ctx.db
      .query("pilaReportValues")
      .withIndex("by_reportId", (q) => q.eq("reportId", id))
      .collect();
    for (const v of vs) await ctx.db.delete(v._id);
    await ctx.db.delete(id);
    return { success: true };
  },
});

export const reopenReport = mutation({
  args: { id: v.id("pilaReports") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "PILA", "pila.manage");
    const report = await ctx.db.get(id);
    if (!report) throw new Error("Reporte no encontrado");
    if (report.status === "DRAFT") {
      throw new Error("Este reporte ya está en borrador.");
    }
    await ctx.db.patch(id, {
      status: "DRAFT",
      submittedAt: undefined,
      reviewedAt: undefined,
      reviewedById: undefined,
      updatedAt: Date.now(),
    });
    const r = await ctx.db.get(id);
    return await serializeReport(ctx, r!, { includeValues: true });
  },
});

export const markReviewed = mutation({
  args: { id: v.id("pilaReports") },
  handler: async (ctx, { id }) => {
    const userId = await requirePermission(ctx, "PILA", "pila.manage");
    const report = await ctx.db.get(id);
    if (!report) throw new Error("Reporte no encontrado");
    if (report.status === "DRAFT") {
      throw new Error(
        "Solo se pueden marcar como revisados reportes enviados.",
      );
    }
    await ctx.db.patch(id, {
      status: "REVIEWED",
      reviewedById: userId,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });
    const r = await ctx.db.get(id);
    return await serializeReport(ctx, r!, { includeValues: true });
  },
});

export const generateReport = query({
  args: {
    yearFrom: v.number(),
    monthFrom: v.number(),
    yearTo: v.number(),
    monthTo: v.number(),
    labId: v.optional(v.id("labs")),
  },
  handler: async (ctx, { yearFrom, monthFrom, yearTo, monthTo, labId }) => {
    const userId = await requirePermission(ctx, "PILA", "pila.read_own");
    const canReadAll = await checkPermission(
      ctx,
      userId,
      "PILA",
      "pila.read_all",
    );
    if (labId && !canReadAll) {
      throw new Error(
        "No tiene permiso para generar informes por laboratorio.",
      );
    }

    let reports = await ctx.db.query("pilaReports").collect();
    reports = reports.filter(
      (r) => r.status === "SUBMITTED" || r.status === "REVIEWED",
    );
    if (labId) reports = reports.filter((r) => r.labId === labId);
    // date range filter (inclusive)
    reports = reports.filter((r) => {
      const key = r.year * 12 + r.month;
      const from = yearFrom * 12 + monthFrom;
      const to = yearTo * 12 + monthTo;
      return key >= from && key <= to;
    });
    reports.sort((a, b) => a.year - b.year || a.month - b.month);

    const labNumbers = await computePilaLabNumbers(ctx);

    const reportsSerialized = await Promise.all(
      reports.map(async (r) => {
        const lab = await ctx.db.get(r.labId);
        const values = await ctx.db
          .query("pilaReportValues")
          .withIndex("by_reportId", (q) => q.eq("reportId", r._id))
          .collect();
        const valuesSerialized = await Promise.all(
          values.map(async (v) => {
            const indicator = await ctx.db.get(v.indicatorId);
            return {
              id: v._id,
              numerator: v.numerator ?? null,
              denominator: v.denominator ?? null,
              doesNotReport: v.doesNotReport,
              indicator: indicator
                ? {
                    id: indicator._id,
                    code: indicator.code,
                    name: indicator.name,
                    formula: indicator.formula,
                    sortOrder: indicator.sortOrder,
                  }
                : null,
            };
          }),
        );
        const pilaNumber = lab ? (labNumbers.get(lab._id) ?? null) : null;
        return {
          id: r._id,
          year: r.year,
          month: r.month,
          status: r.status,
          lab: lab
            ? canReadAll
              ? {
                  id: lab._id,
                  name: lab.name,
                  countryCode: lab.countryCode,
                  pilaNumber,
                }
              : { id: lab._id, name: "", countryCode: "", pilaNumber }
            : null,
          values: valuesSerialized,
        };
      }),
    );

    const indicators = await ctx.db
      .query("pilaIndicators")
      .withIndex("by_active_sortOrder", (q) => q.eq("isActive", true))
      .collect();
    indicators.sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      reports: reportsSerialized,
      indicators: indicators.map((i) => ({
        id: i._id,
        code: i.code,
        name: i.name,
        formula: i.formula,
        numeratorLabel: i.numeratorLabel,
        denominatorLabel: i.denominatorLabel,
        considerations: i.considerations ?? null,
        exclusions: i.exclusions ?? null,
      })),
    };
  },
});

export const generateMyLabReport = query({
  args: {
    yearFrom: v.number(),
    monthFrom: v.number(),
    yearTo: v.number(),
    monthTo: v.number(),
  },
  handler: async (ctx, { yearFrom, monthFrom, yearTo, monthTo }) => {
    const userId = await requirePermission(ctx, "PILA", "pila.read_own");
    const labId = await getUserLabId(ctx, userId);

    let reports = await ctx.db
      .query("pilaReports")
      .withIndex("by_labId_year", (q) => q.eq("labId", labId))
      .collect();
    reports = reports.filter(
      (r) => r.status === "SUBMITTED" || r.status === "REVIEWED",
    );
    reports = reports.filter((r) => {
      const key = r.year * 12 + r.month;
      const from = yearFrom * 12 + monthFrom;
      const to = yearTo * 12 + monthTo;
      return key >= from && key <= to;
    });
    reports.sort((a, b) => a.year - b.year || a.month - b.month);

    const lab = await ctx.db.get(labId);
    const labNumbers = await computePilaLabNumbers(ctx);
    const pilaNumber = lab ? (labNumbers.get(lab._id) ?? null) : null;

    const reportsSerialized = await Promise.all(
      reports.map(async (r) => {
        const values = await ctx.db
          .query("pilaReportValues")
          .withIndex("by_reportId", (q) => q.eq("reportId", r._id))
          .collect();
        const valuesSerialized = await Promise.all(
          values.map(async (v) => {
            const indicator = await ctx.db.get(v.indicatorId);
            return {
              id: v._id,
              numerator: v.numerator ?? null,
              denominator: v.denominator ?? null,
              doesNotReport: v.doesNotReport,
              indicator: indicator
                ? {
                    id: indicator._id,
                    code: indicator.code,
                    name: indicator.name,
                    formula: indicator.formula,
                    sortOrder: indicator.sortOrder,
                  }
                : null,
            };
          }),
        );
        return {
          id: r._id,
          year: r.year,
          month: r.month,
          status: r.status,
          lab: lab
            ? {
                id: lab._id,
                name: lab.name,
                countryCode: lab.countryCode,
                pilaNumber,
              }
            : null,
          values: valuesSerialized,
        };
      }),
    );

    const indicators = await ctx.db
      .query("pilaIndicators")
      .withIndex("by_active_sortOrder", (q) => q.eq("isActive", true))
      .collect();
    indicators.sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      reports: reportsSerialized,
      indicators: indicators.map((i) => ({
        id: i._id,
        code: i.code,
        name: i.name,
        formula: i.formula,
        numeratorLabel: i.numeratorLabel,
        denominatorLabel: i.denominatorLabel,
        considerations: i.considerations ?? null,
        exclusions: i.exclusions ?? null,
      })),
    };
  },
});

// ─── Published reports ────────────────────────────────────────────────
export const publishReport = mutation({
  args: {
    year: v.number(),
    month: v.number(),
    storageId: v.id("_storage"),
    filename: v.string(),
    sizeBytes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requirePermission(ctx, "PILA", "pila.manage");
    const existing = await ctx.db
      .query("pilaPublishedReports")
      .withIndex("by_year_month", (q) =>
        q.eq("year", args.year).eq("month", args.month),
      )
      .unique();
    const now = Date.now();
    if (existing) {
      if (existing.storageId && existing.storageId !== args.storageId) {
        try {
          await ctx.storage.delete(existing.storageId);
        } catch {
          // ignore
        }
      }
      await ctx.db.patch(existing._id, {
        storageId: args.storageId,
        storagePath: `${args.year}-${args.month}-${args.filename}`,
        filename: args.filename,
        sizeBytes: args.sizeBytes ?? undefined,
        publishedById: userId,
      });
      return { ...(await ctx.db.get(existing._id))!, id: existing._id };
    }
    const id = await ctx.db.insert("pilaPublishedReports", {
      year: args.year,
      month: args.month,
      storagePath: `${args.year}-${args.month}-${args.filename}`,
      storageId: args.storageId,
      filename: args.filename,
      sizeBytes: args.sizeBytes ?? undefined,
      publishedById: userId,
      createdAt: now,
    });
    return { ...(await ctx.db.get(id))!, id };
  },
});

export const listPublished = query({
  args: { year: v.optional(v.number()) },
  handler: async (ctx, { year }) => {
    await requirePermission(ctx, "PILA", "pila.read_own");
    let rows = await ctx.db.query("pilaPublishedReports").collect();
    if (year !== undefined) rows = rows.filter((r) => r.year === year);
    rows.sort((a, b) => b.year - a.year || b.month - a.month);
    return Promise.all(
      rows.map(async (r) => {
        const publisher = await ctx.db.get(r.publishedById);
        const url = r.storageId ? await ctx.storage.getUrl(r.storageId) : null;
        return {
          ...r,
          id: r._id,
          url,
          publishedBy: publisher ? { name: publisher.name } : null,
        };
      }),
    );
  },
});

export const unpublishReport = mutation({
  args: { id: v.id("pilaPublishedReports") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "PILA", "pila.manage");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Informe publicado no encontrado");
    if (existing.storageId) {
      try {
        await ctx.storage.delete(existing.storageId);
      } catch {
        // ignore
      }
    }
    await ctx.db.delete(id);
    return { success: true, storagePath: existing.storagePath };
  },
});
