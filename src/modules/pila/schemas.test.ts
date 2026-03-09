import { describe, expect, it } from "vitest";
import {
  CreatePilaIndicatorSchema,
  CreatePilaReportSchema,
  ListPilaReportsQuerySchema,
  PilaIndicatorSchema,
  PilaReportQuerySchema,
  ReportValueInputSchema,
  UpdatePilaIndicatorSchema,
  UpdatePilaReportSchema,
} from "./schemas";

// ── PilaIndicatorSchema ──────────────────────────────────────────

describe("PilaIndicatorSchema", () => {
  const validIndicator = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    code: "I-1",
    name: "Error de ingreso de pacientes",
    formula: "Errores / Ingresos manuales",
    numeratorLabel: "Cantidad de errores",
    denominatorLabel: "Total ingresos manuales",
    considerations: "Criterios de inclusión",
    exclusions: null,
    sortOrder: 1,
    isActive: true,
  };

  it("should validate a complete indicator", () => {
    const result = PilaIndicatorSchema.safeParse(validIndicator);
    expect(result.success).toBe(true);
  });

  it("should reject invalid UUID for id", () => {
    const result = PilaIndicatorSchema.safeParse({
      ...validIndicator,
      id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept null for considerations and exclusions", () => {
    const result = PilaIndicatorSchema.safeParse({
      ...validIndicator,
      considerations: null,
      exclusions: null,
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty code", () => {
    const result = PilaIndicatorSchema.safeParse({
      ...validIndicator,
      code: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty name", () => {
    const result = PilaIndicatorSchema.safeParse({
      ...validIndicator,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer sortOrder", () => {
    const result = PilaIndicatorSchema.safeParse({
      ...validIndicator,
      sortOrder: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

// ── CreatePilaIndicatorSchema ────────────────────────────────────

describe("CreatePilaIndicatorSchema", () => {
  const validInput = {
    code: "I-1",
    name: "Error de ingreso",
    formula: "Errores / Ingresos",
    numeratorLabel: "Errores",
    denominatorLabel: "Ingresos",
  };

  it("should validate minimal create input (uses defaults)", () => {
    const result = CreatePilaIndicatorSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortOrder).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });

  it("should validate full create input", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      considerations: "Some considerations",
      exclusions: "Some exclusions",
      sortOrder: 5,
      isActive: false,
    });
    expect(result.success).toBe(true);
  });

  it("should require code", () => {
    const { code: _code, ...rest } = validInput;
    const result = CreatePilaIndicatorSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should reject empty code", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      code: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Código requerido");
    }
  });

  it("should reject code over 20 characters", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      code: "a".repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it("should require name", () => {
    const { name: _name, ...rest } = validInput;
    const result = CreatePilaIndicatorSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should reject name over 255 characters", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      name: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it("should require formula", () => {
    const { formula: _formula, ...rest } = validInput;
    const result = CreatePilaIndicatorSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should reject formula over 500 characters", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      formula: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("should require numeratorLabel", () => {
    const { numeratorLabel: _numeratorLabel, ...rest } = validInput;
    const result = CreatePilaIndicatorSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should require denominatorLabel", () => {
    const { denominatorLabel: _denominatorLabel, ...rest } = validInput;
    const result = CreatePilaIndicatorSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should accept considerations up to 2000 characters", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      considerations: "a".repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it("should reject considerations over 2000 characters", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      considerations: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("should reject exclusions over 2000 characters", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      exclusions: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative sortOrder", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      sortOrder: -1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer sortOrder", () => {
    const result = CreatePilaIndicatorSchema.safeParse({
      ...validInput,
      sortOrder: 1.5,
    });
    expect(result.success).toBe(false);
  });
});

// ── UpdatePilaIndicatorSchema ────────────────────────────────────

describe("UpdatePilaIndicatorSchema", () => {
  it("should allow partial updates", () => {
    const result = UpdatePilaIndicatorSchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  it("should allow empty object", () => {
    const result = UpdatePilaIndicatorSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should validate code when provided", () => {
    const result = UpdatePilaIndicatorSchema.safeParse({ code: "" });
    expect(result.success).toBe(false);
  });

  it("should allow updating only sortOrder", () => {
    const result = UpdatePilaIndicatorSchema.safeParse({ sortOrder: 10 });
    expect(result.success).toBe(true);
  });

  it("should allow updating only isActive", () => {
    const result = UpdatePilaIndicatorSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
  });
});

// ── ReportValueInputSchema ───────────────────────────────────────

describe("ReportValueInputSchema", () => {
  it("should validate a complete value", () => {
    const result = ReportValueInputSchema.safeParse({
      indicatorId: "550e8400-e29b-41d4-a716-446655440000",
      numerator: 5,
      denominator: 100,
    });
    expect(result.success).toBe(true);
  });

  it("should require indicatorId", () => {
    const result = ReportValueInputSchema.safeParse({
      numerator: 5,
      denominator: 100,
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid indicatorId", () => {
    const result = ReportValueInputSchema.safeParse({
      indicatorId: "not-uuid",
      numerator: 5,
      denominator: 100,
    });
    expect(result.success).toBe(false);
  });

  it("should accept null numerator and denominator", () => {
    const result = ReportValueInputSchema.safeParse({
      indicatorId: "550e8400-e29b-41d4-a716-446655440000",
      numerator: null,
      denominator: null,
    });
    expect(result.success).toBe(true);
  });

  it("should accept without numerator and denominator (optional)", () => {
    const result = ReportValueInputSchema.safeParse({
      indicatorId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject negative numerator", () => {
    const result = ReportValueInputSchema.safeParse({
      indicatorId: "550e8400-e29b-41d4-a716-446655440000",
      numerator: -1,
      denominator: 100,
    });
    expect(result.success).toBe(false);
  });

  it("should reject negative denominator", () => {
    const result = ReportValueInputSchema.safeParse({
      indicatorId: "550e8400-e29b-41d4-a716-446655440000",
      numerator: 5,
      denominator: -1,
    });
    expect(result.success).toBe(false);
  });

  it("should accept zero values", () => {
    const result = ReportValueInputSchema.safeParse({
      indicatorId: "550e8400-e29b-41d4-a716-446655440000",
      numerator: 0,
      denominator: 0,
    });
    expect(result.success).toBe(true);
  });

  it("should accept decimal values", () => {
    const result = ReportValueInputSchema.safeParse({
      indicatorId: "550e8400-e29b-41d4-a716-446655440000",
      numerator: 3.5,
      denominator: 100.7,
    });
    expect(result.success).toBe(true);
  });
});

// ── CreatePilaReportSchema ───────────────────────────────────────

describe("CreatePilaReportSchema", () => {
  it("should validate minimal create input", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2026,
      month: 3,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.values).toEqual([]);
    }
  });

  it("should validate full create input with values", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2026,
      month: 3,
      values: [
        {
          indicatorId: "550e8400-e29b-41d4-a716-446655440000",
          numerator: 5,
          denominator: 100,
        },
        {
          indicatorId: "550e8400-e29b-41d4-a716-446655440001",
          numerator: 2,
          denominator: 50,
        },
      ],
      notes: "Monthly report notes",
    });
    expect(result.success).toBe(true);
  });

  it("should require year", () => {
    const result = CreatePilaReportSchema.safeParse({ month: 3 });
    expect(result.success).toBe(false);
  });

  it("should require month", () => {
    const result = CreatePilaReportSchema.safeParse({ year: 2026 });
    expect(result.success).toBe(false);
  });

  it("should reject year below 2020", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2019,
      month: 1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject year above 2100", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2101,
      month: 1,
    });
    expect(result.success).toBe(false);
  });

  it("should reject month below 1", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2026,
      month: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject month above 12", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2026,
      month: 13,
    });
    expect(result.success).toBe(false);
  });

  it("should accept all valid months", () => {
    for (let m = 1; m <= 12; m++) {
      const result = CreatePilaReportSchema.safeParse({
        year: 2026,
        month: m,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should reject non-integer year", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2026.5,
      month: 3,
    });
    expect(result.success).toBe(false);
  });

  it("should reject non-integer month", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2026,
      month: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it("should reject notes over 2000 characters", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2026,
      month: 3,
      notes: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("should accept notes up to 2000 characters", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2026,
      month: 3,
      notes: "a".repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it("should validate values array items", () => {
    const result = CreatePilaReportSchema.safeParse({
      year: 2026,
      month: 3,
      values: [{ indicatorId: "not-a-uuid", numerator: 5, denominator: 100 }],
    });
    expect(result.success).toBe(false);
  });
});

// ── UpdatePilaReportSchema ───────────────────────────────────────

describe("UpdatePilaReportSchema", () => {
  it("should validate with values and notes", () => {
    const result = UpdatePilaReportSchema.safeParse({
      values: [
        {
          indicatorId: "550e8400-e29b-41d4-a716-446655440000",
          numerator: 10,
          denominator: 200,
        },
      ],
      notes: "Updated notes",
    });
    expect(result.success).toBe(true);
  });

  it("should default values to empty array", () => {
    const result = UpdatePilaReportSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.values).toEqual([]);
    }
  });

  it("should accept null notes", () => {
    const result = UpdatePilaReportSchema.safeParse({ notes: null });
    expect(result.success).toBe(true);
  });

  it("should reject notes over 2000 characters", () => {
    const result = UpdatePilaReportSchema.safeParse({
      notes: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// ── ListPilaReportsQuerySchema ───────────────────────────────────

describe("ListPilaReportsQuerySchema", () => {
  it("should accept empty query (all optional)", () => {
    const result = ListPilaReportsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept year filter", () => {
    const result = ListPilaReportsQuerySchema.safeParse({ year: 2026 });
    expect(result.success).toBe(true);
  });

  it("should accept month filter", () => {
    const result = ListPilaReportsQuerySchema.safeParse({ month: 6 });
    expect(result.success).toBe(true);
  });

  it("should accept status filter DRAFT", () => {
    const result = ListPilaReportsQuerySchema.safeParse({ status: "DRAFT" });
    expect(result.success).toBe(true);
  });

  it("should accept status filter SUBMITTED", () => {
    const result = ListPilaReportsQuerySchema.safeParse({
      status: "SUBMITTED",
    });
    expect(result.success).toBe(true);
  });

  it("should accept status filter REVIEWED", () => {
    const result = ListPilaReportsQuerySchema.safeParse({
      status: "REVIEWED",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid status", () => {
    const result = ListPilaReportsQuerySchema.safeParse({
      status: "REJECTED",
    });
    expect(result.success).toBe(false);
  });

  it("should accept labId filter", () => {
    const result = ListPilaReportsQuerySchema.safeParse({
      labId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid labId", () => {
    const result = ListPilaReportsQuerySchema.safeParse({
      labId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should accept all filters together", () => {
    const result = ListPilaReportsQuerySchema.safeParse({
      year: 2026,
      month: 3,
      status: "SUBMITTED",
      labId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject year below 2020", () => {
    const result = ListPilaReportsQuerySchema.safeParse({ year: 2019 });
    expect(result.success).toBe(false);
  });

  it("should reject month below 1", () => {
    const result = ListPilaReportsQuerySchema.safeParse({ month: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject month above 12", () => {
    const result = ListPilaReportsQuerySchema.safeParse({ month: 13 });
    expect(result.success).toBe(false);
  });
});

// ── PilaReportQuerySchema ────────────────────────────────────────

describe("PilaReportQuerySchema", () => {
  const validQuery = {
    yearFrom: 2026,
    monthFrom: 1,
    yearTo: 2026,
    monthTo: 3,
  };

  it("should validate a complete query", () => {
    const result = PilaReportQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
  });

  it("should accept optional labId", () => {
    const result = PilaReportQuerySchema.safeParse({
      ...validQuery,
      labId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid labId", () => {
    const result = PilaReportQuerySchema.safeParse({
      ...validQuery,
      labId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("should require yearFrom", () => {
    const { yearFrom: _yearFrom, ...rest } = validQuery;
    const result = PilaReportQuerySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should require monthFrom", () => {
    const { monthFrom: _monthFrom, ...rest } = validQuery;
    const result = PilaReportQuerySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should require yearTo", () => {
    const { yearTo: _yearTo, ...rest } = validQuery;
    const result = PilaReportQuerySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should require monthTo", () => {
    const { monthTo: _monthTo, ...rest } = validQuery;
    const result = PilaReportQuerySchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("should reject yearFrom below 2020", () => {
    const result = PilaReportQuerySchema.safeParse({
      ...validQuery,
      yearFrom: 2019,
    });
    expect(result.success).toBe(false);
  });

  it("should reject monthFrom below 1", () => {
    const result = PilaReportQuerySchema.safeParse({
      ...validQuery,
      monthFrom: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject monthTo above 12", () => {
    const result = PilaReportQuerySchema.safeParse({
      ...validQuery,
      monthTo: 13,
    });
    expect(result.success).toBe(false);
  });

  it("should accept same month for from and to", () => {
    const result = PilaReportQuerySchema.safeParse({
      yearFrom: 2026,
      monthFrom: 3,
      yearTo: 2026,
      monthTo: 3,
    });
    expect(result.success).toBe(true);
  });

  it("should accept multi-year range", () => {
    const result = PilaReportQuerySchema.safeParse({
      yearFrom: 2024,
      monthFrom: 6,
      yearTo: 2026,
      monthTo: 12,
    });
    expect(result.success).toBe(true);
  });
});
