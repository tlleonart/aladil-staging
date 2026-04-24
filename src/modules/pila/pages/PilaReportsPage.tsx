"use client";

import { ArrowLeft, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { ConfirmDialog } from "@/modules/shared/ui";
import { ReportTable, type ReportTableData } from "../components";
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

// ── Shared hook for report generation (manual state, no useMutation) ─

function useReportGenerator(params: {
  yearFrom: number;
  monthFrom: number;
  yearTo: number;
  monthTo: number;
  labId?: string;
}) {
  const [data, setData] = useState<ReportTableData | null>(null);
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
      setData(result as ReportTableData);
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  const report = useReportGenerator({
    yearFrom: year,
    monthFrom: month,
    yearTo: year,
    monthTo: month,
  });

  const { data: allLabs = [] } = useQuery({
    queryKey: ["labs", "list"],
    queryFn: () => orpc.labs.list({ limit: 100 }),
  });

  const missingLabs = (() => {
    if (!report.data) return [];
    const presentLabIds = new Set(
      report.data.reports
        .map((r) => r.lab?.id)
        .filter((id): id is string => typeof id === "string"),
    );
    return allLabs
      .filter((l) => l.isActive && !presentLabIds.has(l.id))
      .map((l) => l.name);
  })();

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

  const doPublish = async () => {
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

      // Publish the STANDARD variant (official consolidated anonymous report).
      // The enriched variant is reserved for analysis and is not published.
      const { blob, filename } = result.standard;

      const formData = new FormData();
      formData.append("file", blob, filename);
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

      await publishMutation.mutateAsync({
        year,
        month,
        storageId,
        filename,
        sizeBytes: blob.size,
      });
    } catch (err) {
      if (!publishMutation.isError) {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setPublishing(false);
    }
  };

  const handlePublish = () => {
    if (!report.data || report.data.reports.length === 0) return;
    if (missingLabs.length > 0) {
      setConfirmOpen(true);
      return;
    }
    void doPublish();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Informe mensual con los indicadores de todos los laboratorios. No se
        muestran los nombres de los laboratorios. Al descargar se generan dos
        PDFs: uno estándar y otro enriquecido con estadísticas adicionales.
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => !open && setConfirmOpen(false)}
        title="Laboratorios sin reporte"
        description={
          missingLabs.length === 1
            ? `El laboratorio ${missingLabs[0]} aún no envió su reporte de ${MONTHS[month - 1]} ${year}. ¿Publicar de todas formas?`
            : `Los siguientes laboratorios aún no enviaron su reporte de ${MONTHS[month - 1]} ${year}: ${missingLabs.join(", ")}. ¿Publicar de todas formas?`
        }
        confirmText="Publicar igual"
        isLoading={publishing}
        onConfirm={async () => {
          setConfirmOpen(false);
          await doPublish();
        }}
      />
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
