"use client";

import { Download, FileDown, Loader2 } from "lucide-react";
import { Fragment, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  downloadBlob,
  type ExportPilaPdfResult,
  exportPilaPdf,
} from "../lib/export-pdf";

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

export interface ReportTableData {
  reports: Array<{
    id: string;
    year: number;
    month: number;
    lab?: { id: string; name: string; countryCode: string } | null;
    values: Array<{
      numerator: number | null;
      denominator: number | null;
      doesNotReport?: boolean;
      indicator: {
        id: string;
        code: string;
        name: string;
        formula: string;
        sortOrder?: number;
      };
    }>;
  }>;
  indicators: Array<{
    id: string;
    code: string;
    name: string;
    formula: string;
    numeratorLabel: string;
    denominatorLabel: string;
    considerations?: string | null;
    exclusions?: string | null;
  }>;
}

export interface ReportTableProps {
  data: ReportTableData;
  showLabName?: boolean;
  title: string;
  subtitle: string;
  /** When set, this lab is highlighted in the table + CSV + PDF */
  highlightLabId?: string;
  /** When set, this name is used in the PDF cover + highlight legend */
  highlightLabName?: string;
}

export function ReportTable({
  data,
  showLabName,
  title,
  subtitle,
  highlightLabId,
  highlightLabName,
}: ReportTableProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const result: ExportPilaPdfResult | null = await exportPilaPdf({
        data,
        showLabName: !!showLabName,
        title,
        subtitle,
        highlightLabId,
        highlightLabName,
      });
      if (!result) return;
      downloadBlob(result.standard.blob, result.standard.filename);
      // Small delay between downloads so browsers queue them correctly
      await new Promise((r) => setTimeout(r, 150));
      downloadBlob(result.enriched.blob, result.enriched.filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setPdfError(
        err instanceof Error ? err.message : "Error al generar el PDF",
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportCSV = () => {
    const { reports, indicators } = data;
    const hasHighlight = !!highlightLabId;
    const headers = [
      "Período",
      ...(showLabName ? ["Laboratorio"] : []),
      ...(hasHighlight ? ["Mi lab"] : []),
      ...indicators.flatMap((ind) => [
        `${ind.code} Num`,
        `${ind.code} Den`,
        `${ind.code} %`,
      ]),
    ];

    const rows = reports.map((report) => {
      const period = `${MONTHS[report.month - 1]} ${report.year}`;
      const labName = showLabName ? [report.lab?.name ?? ""] : [];
      const mine = hasHighlight
        ? [report.lab?.id === highlightLabId ? "Sí" : ""]
        : [];
      const values = indicators.flatMap((ind) => {
        const val = report.values.find((v) => v.indicator.id === ind.id);
        const num = val?.numerator;
        const den = val?.denominator;
        const pct =
          num != null && den != null && den > 0
            ? ((num / den) * 100).toFixed(4)
            : "";
        return [num?.toString() ?? "", den?.toString() ?? "", pct];
      });
      return [period, ...labName, ...mine, ...values];
    });

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pila-informe-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (data.reports.length === 0) {
    return (
      <Alert className="border-amber-300 bg-amber-50">
        <AlertDescription className="text-amber-800">
          No hay reportes enviados para este período. Solo se incluyen reportes
          con estado <strong>Enviado</strong> o <strong>Revisado</strong>.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.reports.length} reporte
          {data.reports.length !== 1 ? "s" : ""} encontrados
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" onClick={handleExportPdf} disabled={pdfLoading}>
            {pdfLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            {pdfLoading ? "Generando PDFs..." : "Descargar PDFs"}
          </Button>
        </div>
      </div>

      {pdfError && (
        <Alert variant="destructive">
          <AlertDescription>Error PDF: {pdfError}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-2 py-2 text-left">
                Período
              </th>
              {showLabName && (
                <th className="border border-gray-200 px-2 py-2 text-left">
                  Laboratorio
                </th>
              )}
              {data.indicators.map((ind) => (
                <th
                  key={ind.id}
                  colSpan={3}
                  className="border border-gray-200 px-2 py-2 text-center"
                >
                  <div className="font-semibold">{ind.code}</div>
                  <div className="font-normal text-gray-500 truncate max-w-[120px]">
                    {ind.name}
                  </div>
                </th>
              ))}
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-2 py-1" />
              {showLabName && (
                <th className="border border-gray-200 px-2 py-1" />
              )}
              {data.indicators.map((ind) => (
                <Fragment key={ind.id}>
                  <th className="border border-gray-200 px-1 py-1 text-[10px] font-normal">
                    Num
                  </th>
                  <th className="border border-gray-200 px-1 py-1 text-[10px] font-normal">
                    Den
                  </th>
                  <th className="border border-gray-200 px-1 py-1 text-[10px] font-normal">
                    %
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.reports.map((report) => {
              const isMine =
                highlightLabId && report.lab?.id === highlightLabId;
              return (
                <tr
                  key={report.id}
                  className={
                    isMine ? "bg-amber-50 font-semibold" : "hover:bg-gray-50"
                  }
                >
                  <td className="border border-gray-200 px-2 py-2 whitespace-nowrap font-medium">
                    {isMine && (
                      <span className="inline-block mr-1 align-middle text-amber-700">
                        ★
                      </span>
                    )}
                    {MONTHS[report.month - 1]} {report.year}
                  </td>
                  {showLabName && (
                    <td className="border border-gray-200 px-2 py-2 whitespace-nowrap">
                      {report.lab?.name}
                    </td>
                  )}
                  {data.indicators.map((ind) => {
                    const val = report.values.find(
                      (v) => v.indicator.id === ind.id,
                    );
                    const num = val?.numerator;
                    const den = val?.denominator;
                    const pct =
                      num != null && den != null && den > 0 ? num / den : null;
                    return (
                      <Fragment key={ind.id}>
                        <td className="border border-gray-200 px-1 py-2 text-center">
                          {num != null ? num : "—"}
                        </td>
                        <td className="border border-gray-200 px-1 py-2 text-center">
                          {den != null ? den : "—"}
                        </td>
                        <td className="border border-gray-200 px-1 py-2 text-center font-mono">
                          {pct != null ? `${(pct * 100).toFixed(2)}%` : "—"}
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {highlightLabId && showLabName && (
        <p className="text-xs text-muted-foreground">
          <span className="text-amber-700">★</span> Tu laboratorio.
        </p>
      )}
    </div>
  );
}
