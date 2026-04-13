"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { orpc } from "@/modules/core/orpc/client";
import { useQuery } from "@/modules/core/orpc/react";
import type { ReportValueInput } from "../schemas";

interface ReportValue {
  indicatorId: string;
  numerator: number | null;
  denominator: number | null;
  doesNotReport?: boolean;
}

interface PilaReportFormProps {
  defaultValues?: ReportValue[];
  defaultNotes?: string;
  defaultYear?: number;
  defaultMonth?: number;
  onSubmit: (data: {
    year: number;
    month: number;
    values: ReportValueInput[];
    notes?: string;
  }) => void;
  isLoading?: boolean;
  submitLabel?: string;
  readOnly?: boolean;
  hideYearMonth?: boolean;
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function PilaReportForm({
  defaultValues = [],
  defaultNotes = "",
  defaultYear,
  defaultMonth,
  onSubmit,
  isLoading,
  submitLabel = "Guardar Borrador",
  readOnly = false,
  hideYearMonth = false,
}: PilaReportFormProps) {
  const now = new Date();
  const [year, setYear] = useState(defaultYear ?? now.getFullYear());
  const [month, setMonth] = useState(defaultMonth ?? now.getMonth() + 1);
  const [notes, setNotes] = useState(defaultNotes);

  // Load active indicators from the DB
  const { data: indicators = [] } = useQuery({
    queryKey: ["pila", "indicators"],
    queryFn: () => orpc.pila.listIndicators({}),
  });

  const activeIndicators = indicators.filter((i) => i.isActive);

  // Build values state from defaults + active indicators
  const [valuesMap, setValuesMap] = useState<
    Record<
      string,
      {
        numerator: number | null;
        denominator: number | null;
        doesNotReport: boolean;
      }
    >
  >(() => {
    const map: Record<
      string,
      {
        numerator: number | null;
        denominator: number | null;
        doesNotReport: boolean;
      }
    > = {};
    for (const v of defaultValues) {
      map[v.indicatorId] = {
        numerator: v.numerator,
        denominator: v.denominator,
        doesNotReport: v.doesNotReport ?? false,
      };
    }
    return map;
  });

  const updateValue = (
    indicatorId: string,
    field: "numerator" | "denominator",
    raw: string,
  ) => {
    setValuesMap((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        numerator: prev[indicatorId]?.numerator ?? null,
        denominator: prev[indicatorId]?.denominator ?? null,
        doesNotReport: prev[indicatorId]?.doesNotReport ?? false,
        [field]: raw === "" ? null : Number.parseFloat(raw),
      },
    }));
  };

  const toggleDoesNotReport = (indicatorId: string, checked: boolean) => {
    setValuesMap((prev) => ({
      ...prev,
      [indicatorId]: {
        numerator: checked ? null : (prev[indicatorId]?.numerator ?? null),
        denominator: checked ? null : (prev[indicatorId]?.denominator ?? null),
        doesNotReport: checked,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const values: ReportValueInput[] = activeIndicators.map((ind) => ({
      indicatorId: ind.id,
      numerator: valuesMap[ind.id]?.doesNotReport
        ? null
        : (valuesMap[ind.id]?.numerator ?? null),
      denominator: valuesMap[ind.id]?.doesNotReport
        ? null
        : (valuesMap[ind.id]?.denominator ?? null),
      doesNotReport: valuesMap[ind.id]?.doesNotReport ?? false,
    }));
    onSubmit({ year, month, values, notes: notes || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Year & Month */}
      {!hideYearMonth && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Año *</Label>
            <Input
              type="number"
              min={2020}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number.parseInt(e.target.value, 10))}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label>Mes *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={month}
              onChange={(e) => setMonth(Number.parseInt(e.target.value, 10))}
              disabled={readOnly}
            >
              {MONTHS.map((name, idx) => (
                <option key={name} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Indicators */}
      <div className="space-y-4">
        {activeIndicators.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No hay indicadores activos configurados.
          </p>
        ) : (
          activeIndicators.map((indicator) => {
            const val = valuesMap[indicator.id];
            const isNR = val?.doesNotReport ?? false;
            const num = val?.numerator;
            const den = val?.denominator;
            const calculated =
              !isNR && num != null && den != null && den > 0 ? num / den : null;

            return (
              <div
                key={indicator.id}
                className={`rounded-lg border p-4 space-y-3 ${isNR ? "bg-neutral-50 border-neutral-300" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-700">
                      {indicator.code}
                    </span>
                    <span className="text-sm font-medium">
                      {indicator.name}
                    </span>
                    {(indicator.considerations || indicator.exclusions) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-sm text-xs"
                          >
                            {indicator.considerations && (
                              <p className="mb-1">
                                <strong>Consideraciones:</strong>{" "}
                                {indicator.considerations}
                              </p>
                            )}
                            {indicator.exclusions && (
                              <p>
                                <strong>Exclusiones:</strong>{" "}
                                {indicator.exclusions}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  {isNR ? (
                    <span className="text-sm font-mono font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded whitespace-nowrap">
                      N/R
                    </span>
                  ) : (
                    calculated !== null && (
                      <span className="text-sm font-mono font-semibold bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                        {(calculated * 100).toFixed(4)}%
                      </span>
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {indicator.formula}
                </p>

                {/* No reporta toggle */}
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`nr-${indicator.id}`}
                      checked={isNR}
                      onCheckedChange={(checked) =>
                        toggleDoesNotReport(indicator.id, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`nr-${indicator.id}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      No reporta (N/R)
                    </Label>
                  </div>
                )}

                {/* Numerator / Denominator inputs */}
                {!isNR && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {indicator.numeratorLabel}
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        value={num ?? ""}
                        onChange={(e) =>
                          updateValue(indicator.id, "numerator", e.target.value)
                        }
                        disabled={readOnly}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {indicator.denominatorLabel}
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        value={den ?? ""}
                        onChange={(e) =>
                          updateValue(
                            indicator.id,
                            "denominator",
                            e.target.value,
                          )
                        }
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                )}

                {/* Read-only N/R display */}
                {readOnly && isNR && (
                  <p className="text-sm text-amber-600 font-medium">
                    Este indicador no fue reportado para este período.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notas / Observaciones</Label>
        <Textarea
          placeholder="Observaciones adicionales sobre este período..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={readOnly}
        />
      </div>

      {!readOnly && (
        <div className="flex gap-4 pt-4 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
