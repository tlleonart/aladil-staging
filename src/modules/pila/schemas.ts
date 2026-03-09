import * as z from "zod";

// ── Indicator schema ──────────────────────────────────────────────

export const PilaIndicatorSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  formula: z.string().min(1),
  numeratorLabel: z.string().min(1),
  denominatorLabel: z.string().min(1),
  considerations: z.string().nullable(),
  exclusions: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});

export const CreatePilaIndicatorSchema = z.object({
  code: z.string().min(1, "Código requerido").max(20),
  name: z.string().min(1, "Nombre requerido").max(255),
  formula: z.string().min(1, "Fórmula requerida").max(500),
  numeratorLabel: z.string().min(1, "Label de numerador requerido").max(255),
  denominatorLabel: z
    .string()
    .min(1, "Label de denominador requerido")
    .max(255),
  considerations: z.string().max(2000).optional(),
  exclusions: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdatePilaIndicatorSchema = CreatePilaIndicatorSchema.partial();

// ── Report value schema ───────────────────────────────────────────

export const ReportValueInputSchema = z.object({
  indicatorId: z.string().uuid(),
  numerator: z.number().min(0).nullable().optional(),
  denominator: z.number().min(0).nullable().optional(),
});

// ── Report schemas ────────────────────────────────────────────────

export const CreatePilaReportSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  values: z.array(ReportValueInputSchema).default([]),
  notes: z.string().max(2000).optional(),
});

export const UpdatePilaReportSchema = z.object({
  values: z.array(ReportValueInputSchema).default([]),
  notes: z.string().max(2000).nullable().optional(),
});

export const ListPilaReportsQuerySchema = z.object({
  year: z.number().int().min(2020).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "REVIEWED"]).optional(),
  labId: z.string().uuid().optional(),
});

// ── Report generation schemas ─────────────────────────────────────

export const PilaReportQuerySchema = z.object({
  yearFrom: z.number().int().min(2020).max(2100),
  monthFrom: z.number().int().min(1).max(12),
  yearTo: z.number().int().min(2020).max(2100),
  monthTo: z.number().int().min(1).max(12),
  labId: z.string().uuid().optional(),
});

// ── Types ─────────────────────────────────────────────────────────

export type PilaIndicator = z.infer<typeof PilaIndicatorSchema>;
export type CreatePilaIndicator = z.infer<typeof CreatePilaIndicatorSchema>;
export type UpdatePilaIndicator = z.infer<typeof UpdatePilaIndicatorSchema>;
export type ReportValueInput = z.infer<typeof ReportValueInputSchema>;
export type CreatePilaReport = z.infer<typeof CreatePilaReportSchema>;
export type UpdatePilaReport = z.infer<typeof UpdatePilaReportSchema>;
export type PilaReportQuery = z.infer<typeof PilaReportQuerySchema>;
