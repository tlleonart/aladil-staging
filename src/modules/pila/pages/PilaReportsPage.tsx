"use client";

import { ArrowLeft, Download, FileDown, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";
import { downloadBlob, exportPilaPdf } from "../lib/export-pdf";

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

// ── Shared report table ──────────────────────────────────────────

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

interface ReportTableProps {
  data: ReportData;
  showLabName?: boolean;
  title: string;
  subtitle: string;
}

function ReportTable({ data, showLabName, title, subtitle }: ReportTableProps) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleExportPdf = async () => {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const result = await exportPilaPdf({
        data,
        showLabName: !!showLabName,
        title,
        subtitle,
      });
      if (result) downloadBlob(result.blob, result.filename);
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
    const headers = [
      "Período",
      ...(showLabName ? ["Laboratorio"] : []),
      ...indicators.flatMap((ind) => [
        `${ind.code} Num`,
        `${ind.code} Den`,
        `${ind.code} %`,
      ]),
    ];

    const rows = reports.map((report) => {
      const period = `${MONTHS[report.month - 1]} ${report.year}`;
      const labName = showLabName ? [report.lab?.name ?? ""] : [];
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
      return [period, ...labName, ...values];
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
            {pdfLoading ? "Generando PDF..." : "Descargar PDF"}
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
            {data.reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-2 py-2 whitespace-nowrap font-medium">
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
                        {num != null ? num : "\u2014"}
                      </td>
                      <td className="border border-gray-200 px-1 py-2 text-center">
                        {den != null ? den : "\u2014"}
                      </td>
                      <td className="border border-gray-200 px-1 py-2 text-center font-mono">
                        {pct != null ? `${(pct * 100).toFixed(2)}%` : "\u2014"}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Shared hook for report generation (manual state, no useMutation) ─

function useReportGenerator(params: {
  yearFrom: number;
  monthFrom: number;
  yearTo: number;
  monthTo: number;
  labId?: string;
}) {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await orpc.pila.generateReport({
        yearFrom: params.yearFrom,
        monthFrom: params.monthFrom,
        yearTo: params.yearTo,
        monthTo: params.monthTo,
        ...(params.labId && { labId: params.labId }),
      });
      setData(result as ReportData);
    } catch (err) {
      console.error("generateReport error:", err);
      const message =
        err instanceof Error ? err.message : "Error al generar el informe";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return { data, error, loading, generate };
}

// ── Tab: Monthly Report (all labs, anonymous) ────────────────────

function MonthlyReport() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [publishing, setPublishing] = useState(false);
  const queryClient = useQueryClient();

  const report = useReportGenerator({
    yearFrom: year,
    monthFrom: month,
    yearTo: year,
    monthTo: month,
  });

  const publishMutation = useMutation({
    mutationFn: (data: {
      year: number;
      month: number;
      storageId: string;
      filename: string;
      sizeBytes?: number;
    }) => orpc.pila.publishReport(data),
    onSuccess: () => {
      toast.success("Informe publicado correctamente");
      queryClient.invalidateQueries({ queryKey: ["pila", "published"] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handlePublish = async () => {
    if (!report.data || report.data.reports.length === 0) return;
    setPublishing(true);
    try {
      const result = await exportPilaPdf({
        data: report.data,
        showLabName: false,
        title: "Informe Mensual PILA",
        subtitle: `${MONTHS[month - 1]} ${year}`,
      });
      if (!result) return;

      // Upload via server-side API (now backed by Convex Storage)
      const formData = new FormData();
      formData.append("file", result.blob, result.filename);
      const uploadRes = await fetch("/api/pila/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(body.error || "Error al subir el archivo");
      }
      const { storageId } = (await uploadRes.json()) as {
        storageId: string;
      };

      // Save record in DB
      await publishMutation.mutateAsync({
        year,
        month,
        storageId,
        filename: result.filename,
        sizeBytes: result.blob.size,
      });

      // Also download locally
      downloadBlob(result.blob, result.filename);
    } catch (err) {
      if (!publishMutation.isError) {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Informe mensual con los indicadores de todos los laboratorios. No se
        muestran los nombres de los laboratorios.
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
        <Button onClick={report.generate} disabled={report.loading}>
          {report.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {report.loading ? "Generando..." : "Generar Informe"}
        </Button>
      </div>

      {report.error && (
        <Alert variant="destructive">
          <AlertDescription>{report.error}</AlertDescription>
        </Alert>
      )}

      {report.data && (
        <>
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {report.data.reports.length} reporte
              {report.data.reports.length !== 1 ? "s" : ""} encontrados
            </p>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {publishing ? "Publicando..." : "Publicar para Laboratorios"}
            </Button>
          </div>
          <ReportTable
            data={report.data}
            showLabName={false}
            title="Informe Mensual PILA"
            subtitle={`${MONTHS[month - 1]} ${year}`}
          />
        </>
      )}
    </div>
  );
}

// ── Tab: Custom Range Report (all labs, anonymous) ───────────────

function CustomRangeReport() {
  const [yearFrom, setYearFrom] = useState(currentYear);
  const [monthFrom, setMonthFrom] = useState(1);
  const [yearTo, setYearTo] = useState(currentYear);
  const [monthTo, setMonthTo] = useState(currentMonth);

  const report = useReportGenerator({ yearFrom, monthFrom, yearTo, monthTo });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Informe con plazo personalizado. Todos los laboratorios, sin nombres.
      </p>

      <div className="flex items-end gap-4 flex-wrap">
        <div className="space-y-1">
          <Label>Desde — Año</Label>
          <Select
            value={String(yearFrom)}
            onValueChange={(v) => setYearFrom(Number(v))}
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
          <Label>Desde — Mes</Label>
          <Select
            value={String(monthFrom)}
            onValueChange={(v) => setMonthFrom(Number(v))}
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
        <div className="space-y-1">
          <Label>Hasta — Año</Label>
          <Select
            value={String(yearTo)}
            onValueChange={(v) => setYearTo(Number(v))}
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
          <Label>Hasta — Mes</Label>
          <Select
            value={String(monthTo)}
            onValueChange={(v) => setMonthTo(Number(v))}
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
        <Button onClick={report.generate} disabled={report.loading}>
          {report.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {report.loading ? "Generando..." : "Generar Informe"}
        </Button>
      </div>

      {report.error && (
        <Alert variant="destructive">
          <AlertDescription>{report.error}</AlertDescription>
        </Alert>
      )}

      {report.data && (
        <>
          <Separator />
          <ReportTable
            data={report.data}
            showLabName={false}
            title="Informe PILA — Período Personalizado"
            subtitle={`${MONTHS[monthFrom - 1]} ${yearFrom} — ${MONTHS[monthTo - 1]} ${yearTo}`}
          />
        </>
      )}
    </div>
  );
}

// ── Tab: Per-Lab Report ──────────────────────────────────────────

function LabReport() {
  const [labId, setLabId] = useState<string>("");
  const [yearFrom, setYearFrom] = useState(currentYear);
  const [monthFrom, setMonthFrom] = useState(1);
  const [yearTo, setYearTo] = useState(currentYear);
  const [monthTo, setMonthTo] = useState(currentMonth);

  const { data: labs = [] } = useQuery({
    queryKey: ["labs", "list"],
    queryFn: () => orpc.labs.list({ limit: 100 }),
  });

  const report = useReportGenerator({
    yearFrom,
    monthFrom,
    yearTo,
    monthTo,
    labId: labId || undefined,
  });

  const labName = labs.find((l) => l.id === labId)?.name ?? "";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Informe individual por laboratorio con período personalizado.
      </p>

      <div className="flex items-end gap-4 flex-wrap">
        <div className="space-y-1">
          <Label>Laboratorio</Label>
          <Select value={labId || "none"} onValueChange={setLabId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar laboratorio" />
            </SelectTrigger>
            <SelectContent>
              {labs.map((lab) => (
                <SelectItem key={lab.id} value={lab.id}>
                  {lab.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Desde — Año</Label>
          <Select
            value={String(yearFrom)}
            onValueChange={(v) => setYearFrom(Number(v))}
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
          <Label>Desde — Mes</Label>
          <Select
            value={String(monthFrom)}
            onValueChange={(v) => setMonthFrom(Number(v))}
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
        <div className="space-y-1">
          <Label>Hasta — Año</Label>
          <Select
            value={String(yearTo)}
            onValueChange={(v) => setYearTo(Number(v))}
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
          <Label>Hasta — Mes</Label>
          <Select
            value={String(monthTo)}
            onValueChange={(v) => setMonthTo(Number(v))}
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
        <Button onClick={report.generate} disabled={!labId || report.loading}>
          {report.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {report.loading ? "Generando..." : "Generar Informe"}
        </Button>
      </div>

      {report.error && (
        <Alert variant="destructive">
          <AlertDescription>{report.error}</AlertDescription>
        </Alert>
      )}

      {report.data && (
        <>
          <Separator />
          <ReportTable
            data={report.data}
            showLabName={true}
            title={`Informe PILA — ${labName}`}
            subtitle={`${MONTHS[monthFrom - 1]} ${yearFrom} — ${MONTHS[monthTo - 1]} ${yearTo}`}
          />
        </>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export function PilaReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/pila">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Informes PILA</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generador de Informes</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly">
            <TabsList className="mb-4">
              <TabsTrigger value="monthly">Informe Mensual</TabsTrigger>
              <TabsTrigger value="custom">Período Personalizado</TabsTrigger>
              <TabsTrigger value="lab">Por Laboratorio</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly">
              <MonthlyReport />
            </TabsContent>
            <TabsContent value="custom">
              <CustomRangeReport />
            </TabsContent>
            <TabsContent value="lab">
              <LabReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
