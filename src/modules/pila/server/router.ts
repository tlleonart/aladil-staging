import * as z from "zod";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { fromConvex } from "@/modules/core/orpc/errors";
import { protectedProcedure } from "@/modules/core/orpc/server";
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

// ── Indicators ────────────────────────────────────────────────────
const listIndicators = protectedProcedure.handler(async ({ context }) =>
  fromConvex(() => context.convex.query(api.pila.listIndicators, {})),
);

const createIndicator = protectedProcedure
  .input(CreatePilaIndicatorSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.createIndicator, input),
    ),
  );

const updateIndicator = protectedProcedure
  .input(
    z.object({ id: z.string().min(1), data: UpdatePilaIndicatorSchema }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.updateIndicator, {
        id: input.id as Id<"pilaIndicators">,
        data: input.data,
      }),
    ),
  );

const toggleIndicator = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.toggleIndicator, {
        id: input.id as Id<"pilaIndicators">,
      }),
    ),
  );

const deleteIndicator = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.deleteIndicator, {
        id: input.id as Id<"pilaIndicators">,
      }),
    ),
  );

// ── Reporter ────────────────────────────────────────────────────
const myReports = protectedProcedure
  .input(z.object({ year: z.number().int().min(2020).max(2100).optional() }))
  .handler(async ({ input, context }) =>
    fromConvex(() => context.convex.query(api.pila.myReports, input)),
  );

const getById = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.pila.getReportById, {
        id: input.id as Id<"pilaReports">,
      }),
    ),
  );

const create = protectedProcedure
  .input(CreatePilaReportSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.createReport, {
        year: input.year,
        month: input.month,
        notes: input.notes,
        values: input.values.map((v) => ({
          indicatorId: v.indicatorId as Id<"pilaIndicators">,
          numerator: v.numerator,
          denominator: v.denominator,
          doesNotReport: v.doesNotReport,
        })),
      }),
    ),
  );

const update = protectedProcedure
  .input(z.object({ id: z.string().min(1), data: UpdatePilaReportSchema }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.updateReport, {
        id: input.id as Id<"pilaReports">,
        data: {
          notes: input.data.notes,
          values: input.data.values.map((v) => ({
            indicatorId: v.indicatorId as Id<"pilaIndicators">,
            numerator: v.numerator,
            denominator: v.denominator,
            doesNotReport: v.doesNotReport,
          })),
        },
      }),
    ),
  );

const submit = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const updated = await fromConvex(() =>
      context.convex.mutation(api.pila.submitReport, {
        id: input.id as Id<"pilaReports">,
      }),
    );

    if (updated?.lab && updated?.submittedBy) {
      const emailData = {
        reporterName:
          updated.submittedBy.name || updated.submittedBy.email || "",
        reporterEmail: updated.submittedBy.email || "",
        labName: updated.lab.name,
        year: updated.year,
        month: updated.month,
        values: (updated.values ?? []).map((v) => ({
          indicatorCode: v.indicator?.code ?? "",
          indicatorName: v.indicator?.name ?? "",
          numerator: v.numerator,
          denominator: v.denominator,
          doesNotReport: v.doesNotReport,
        })),
      };
      sendReportSubmittedToReporter(emailData).catch((err) =>
        console.error("[PILA Email] reporter:", err),
      );
      sendReportSubmittedToAdmin(emailData).catch((err) =>
        console.error("[PILA Email] admin:", err),
      );
    }

    return updated;
  });

const pendingStatus = protectedProcedure.handler(async ({ context }) =>
  fromConvex(() => context.convex.query(api.pila.pendingStatus, {})),
);

const integralStatus = protectedProcedure
  .input(
    z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
    }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() => context.convex.query(api.pila.integralStatus, input)),
  );

// ── Admin ────────────────────────────────────────────────────
const listAll = protectedProcedure
  .input(ListPilaReportsQuerySchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.pila.listAll, {
        year: input.year,
        month: input.month,
        status: input.status,
        labId: input.labId
          ? (input.labId as Id<"labs">)
          : undefined,
      }),
    ),
  );

const remove = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.removeReport, {
        id: input.id as Id<"pilaReports">,
      }),
    ),
  );

const reopen = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.reopenReport, {
        id: input.id as Id<"pilaReports">,
      }),
    ),
  );

const markReviewed = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.markReviewed, {
        id: input.id as Id<"pilaReports">,
      }),
    ),
  );

const generateReport = protectedProcedure
  .input(PilaReportQuerySchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.pila.generateReport, {
        yearFrom: input.yearFrom,
        monthFrom: input.monthFrom,
        yearTo: input.yearTo,
        monthTo: input.monthTo,
        labId: input.labId
          ? (input.labId as Id<"labs">)
          : undefined,
      }),
    ),
  );

// ── Published ────────────────────────────────────────────────────
const publishReport = protectedProcedure
  .input(
    z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
      storageId: z.string().min(1),
      filename: z.string().min(1),
      sizeBytes: z.number().int().optional(),
    }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.publishReport, {
        year: input.year,
        month: input.month,
        storageId: input.storageId as Id<"_storage">,
        filename: input.filename,
        sizeBytes: input.sizeBytes,
      }),
    ),
  );

const listPublished = protectedProcedure
  .input(z.object({ year: z.number().int().min(2020).max(2100).optional() }))
  .handler(async ({ input, context }) =>
    fromConvex(() => context.convex.query(api.pila.listPublished, input)),
  );

const unpublishReport = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.pila.unpublishReport, {
        id: input.id as Id<"pilaPublishedReports">,
      }),
    ),
  );

export const pilaRouter = {
  listIndicators,
  createIndicator,
  updateIndicator,
  toggleIndicator,
  deleteIndicator,
  myReports,
  getById,
  create,
  update,
  submit,
  pendingStatus,
  integralStatus,
  listAll,
  remove,
  reopen,
  markReviewed,
  generateReport,
  publishReport,
  listPublished,
  unpublishReport,
};
