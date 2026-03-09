"use client";

import {
  AlertCircle,
  AlertTriangle,
  Download,
  FileDown,
  Loader2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { ConfirmDialog } from "@/modules/shared/ui";
import { PilaStatusBadge } from "../components";
import { exportPilaPdf } from "../lib/export-pdf";

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

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

interface PilaPageProps {
  canSubmit: boolean;
}

// ── Anonymous Monthly Report Section ─────────────────────────────

function AnonymousMonthlyReport() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if integral report is available (all reports REVIEWED)
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["pila", "integralStatus", year, month],
    queryFn: () => orpc.pila.integralStatus({ year, month }),
  });

  const available = status?.available ?? false;

  const fetchReportData = async (): Promise<ReportData | null> => {
    try {
      const result = await orpc.pila.generateReport({
        yearFrom: year,
        monthFrom: month,
        yearTo: year,
        monthTo: month,
      });
      return result as ReportData;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al descargar el informe",
      );
      return null;
    }
  };

  const handleExportPdf = async () => {
    setPdfLoading(true);
    setError(null);
    try {
      const data = await fetchReportData();
      if (!data || data.reports.length === 0) return;
      await exportPilaPdf({
        data,
        showLabName: false,
        title: "Informe Mensual PILA",
        subtitle: `${MONTHS[month - 1]} ${year}`,
      });
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Error al generar el PDF");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setCsvLoading(true);
    setError(null);
    try {
      const data = await fetchReportData();
      if (!data || data.reports.length === 0) return;
      const headers = [
        "Lab",
        ...data.indicators.flatMap((ind) => [
          `${ind.code} Num`,
          `${ind.code} Den`,
          `${ind.code} %`,
        ]),
      ];
      const rows = data.reports.map((report, idx) => {
        const label = `Lab ${idx + 1}`;
        const values = data.indicators.flatMap((ind) => {
          const val = report.values.find((v) => v.indicator.id === ind.id);
          const num = val?.numerator;
          const den = val?.denominator;
          const pct =
            num != null && den != null && den > 0
              ? ((num / den) * 100).toFixed(4)
              : "";
          return [num?.toString() ?? "", den?.toString() ?? "", pct];
        });
        return [label, ...values];
      });
      const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pila-informe-${MONTHS[month - 1]}-${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCsvLoading(false);
    }
  };

  const isDownloading = pdfLoading || csvLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informe Mensual Integrado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Informe mensual con los indicadores de todos los laboratorios. Los
          nombres de los laboratorios no se muestran. Disponible una vez que
          todos los reportes del mes hayan sido revisados por el administrador.
        </p>

        <div className="flex items-end gap-4">
          <div className="space-y-1">
            <Label>Año</Label>
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Mes</Label>
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, idx) => (
                  <SelectItem key={name} value={String(idx + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={!available || isDownloading}
            >
              {csvLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {csvLoading ? "Descargando..." : "Descargar CSV"}
            </Button>
            <Button
              onClick={handleExportPdf}
              disabled={!available || isDownloading}
            >
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {pdfLoading ? "Descargando..." : "Descargar Informe"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!statusLoading && !available && status && (
          <Alert className="border-amber-300 bg-amber-50">
            <AlertDescription className="text-amber-800">
              {status.total === 0
                ? "No hay reportes cargados para este mes."
                : `Informe no disponible. ${status.reviewed} de ${status.total} reportes revisados.`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ── Type for anonymous report data ───────────────────────────────

interface ReportData {
  reports: Array<{
    id: string;
    year: number;
    month: number;
    lab?: { id: string; name: string; countryCode: string } | null;
    values: Array<{
      numerator: number | null;
      denominator: number | null;
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

// ── Main Page ────────────────────────────────────────────────────

export const PilaPage = ({ canSubmit }: PilaPageProps) => {
  const [year, setYear] = useState(currentYear);
  const queryClient = useQueryClient();
  const [submitId, setSubmitId] = useState<string | null>(null);

  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pila", "myReports", year],
    queryFn: () => orpc.pila.myReports({ year }),
  });

  // Check if current month report is pending (only for reporters)
  const { data: pending } = useQuery({
    queryKey: ["pila", "pendingStatus"],
    queryFn: () => orpc.pila.pendingStatus({}),
    enabled: canSubmit,
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => orpc.pila.submit({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila"] });
      setSubmitId(null);
    },
  });

  if (error) {
    const message =
      (error as { message?: string })?.message || "Error al cargar reportes";
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Programa PILA</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const showPendingWarning = canSubmit && pending && !pending.hasReport;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Programa PILA</h1>
        {canSubmit && (
          <Button asChild>
            <Link href="/admin/pila/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Reporte
            </Link>
          </Button>
        )}
      </div>

      {/* Pending report notification */}
      {showPendingWarning && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Reporte pendiente</AlertTitle>
          <AlertDescription className="text-amber-700">
            No se ha cargado el reporte de{" "}
            <strong>
              {MONTHS[pending.month - 1]} {pending.year}
            </strong>
            .{" "}
            <Link
              href="/admin/pila/new"
              className="underline font-medium hover:text-amber-900"
            >
              Cargar ahora
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Year filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Año:</span>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports list */}
      <Card>
        <CardHeader>
          <CardTitle>
            Mis Reportes — {year}
            {reports.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({reports.length}{" "}
                {reports.length === 1 ? "reporte" : "reportes"})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              Cargando...
            </p>
          ) : reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay reportes para este año.
              {canSubmit && " Creá uno nuevo."}
            </p>
          ) : (
            <div className="grid gap-3">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/admin/pila/${report.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <div className="text-2xl font-bold">
                        {String(report.month).padStart(2, "0")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {MONTHS[report.month - 1]}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">
                        Reporte {MONTHS[report.month - 1]} {report.year}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {report.lab?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PilaStatusBadge
                      status={
                        report.status as "DRAFT" | "SUBMITTED" | "REVIEWED"
                      }
                    />
                    {canSubmit && report.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          setSubmitId(report.id);
                        }}
                      >
                        Enviar
                      </Button>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anonymous monthly report section */}
      <AnonymousMonthlyReport />

      {canSubmit && (
        <ConfirmDialog
          open={!!submitId}
          onOpenChange={(open) => !open && setSubmitId(null)}
          title="Enviar Reporte"
          description="¿Estás seguro de que deseas enviar este reporte? Una vez enviado no podrás editarlo."
          confirmText="Enviar"
          isLoading={submitMutation.isPending}
          onConfirm={() => submitId && submitMutation.mutate(submitId)}
        />
      )}
    </div>
  );
};
