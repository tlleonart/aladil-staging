"use client";

import {
  CheckCircle,
  FileBarChart,
  RotateCcw,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";
import { ConfirmDialog } from "@/modules/shared/ui";
import { PilaStatusBadge } from "../components";

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
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);

export function PilaAdminPage() {
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<
    "DRAFT" | "SUBMITTED" | "REVIEWED" | undefined
  >(undefined);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [reopenId, setReopenId] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["pila", "listAll", year, month, statusFilter],
    queryFn: () =>
      orpc.pila.listAll({
        year,
        month,
        status: statusFilter,
      }),
  });

  const { data: labs = [] } = useQuery({
    queryKey: ["labs", "list"],
    queryFn: () => orpc.labs.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orpc.pila.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila"] });
      setDeleteId(null);
      toast.success("Reporte eliminado correctamente");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al eliminar el reporte"));
    },
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => orpc.pila.reopen({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila"] });
      setReopenId(null);
      toast.success("Reporte reabierto correctamente");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al reabrir el reporte"));
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (id: string) => orpc.pila.markReviewed({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila"] });
      toast.success("Reporte marcado como revisado");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al marcar como revisado"));
    },
  });

  // Stats
  const totalLabs = labs.length;
  const submittedCount = reports.filter((r) => r.status === "SUBMITTED").length;
  const reviewedCount = reports.filter((r) => r.status === "REVIEWED").length;
  const draftCount = reports.filter((r) => r.status === "DRAFT").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Programa PILA — Administración</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/pila/reports">
              <FileBarChart className="mr-2 h-4 w-4" />
              Informes
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/pila/indicators">
              <Settings className="mr-2 h-4 w-4" />
              Indicadores
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Año:</span>
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

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mes:</span>
          <Select
            value={month ? String(month) : "all"}
            onValueChange={(v) => setMonth(v === "all" ? undefined : Number(v))}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {MONTHS.map((name, idx) => (
                <SelectItem key={name} value={String(idx + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Estado:</span>
          <Select
            value={statusFilter || "all"}
            onValueChange={(v) =>
              setStatusFilter(
                v === "all"
                  ? undefined
                  : (v as "DRAFT" | "SUBMITTED" | "REVIEWED"),
              )
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="SUBMITTED">Enviado</SelectItem>
              <SelectItem value="REVIEWED">Revisado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalLabs}</div>
            <p className="text-xs text-muted-foreground">
              Laboratorios registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-700">
              {submittedCount}
            </div>
            <p className="text-xs text-muted-foreground">Reportes enviados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-700">
              {reviewedCount}
            </div>
            <p className="text-xs text-muted-foreground">Reportes revisados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-700">
              {draftCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Reportes en borrador
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports list */}
      <Card>
        <CardHeader>
          <CardTitle>
            Reportes {month ? MONTHS[month - 1] : ""} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              Cargando...
            </p>
          ) : reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay reportes para este período.
            </p>
          ) : (
            <div className="grid gap-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <Link
                    href={`/admin/pila/${report.id}`}
                    className="flex items-center gap-4 flex-1 hover:opacity-80"
                  >
                    <div className="text-center min-w-[60px]">
                      <div className="text-lg font-bold">
                        {String(report.month).padStart(2, "0")}/{report.year}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{report.lab?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.lab?.countryCode}
                        {report.submittedBy && ` · ${report.submittedBy.name}`}
                        {report.submittedAt &&
                          ` · Enviado: ${new Date(report.submittedAt).toLocaleDateString()}`}
                        {report.reviewedAt &&
                          ` · Revisado: ${new Date(report.reviewedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <PilaStatusBadge
                      status={
                        report.status as "DRAFT" | "SUBMITTED" | "REVIEWED"
                      }
                    />
                    {report.status === "SUBMITTED" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Marcar como revisado"
                        onClick={() => reviewMutation.mutate(report.id)}
                        disabled={reviewMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    {report.status !== "DRAFT" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Reabrir reporte"
                        onClick={() => setReopenId(report.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      title="Eliminar reporte"
                      onClick={() => setDeleteId(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Reporte"
        description="¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />

      <ConfirmDialog
        open={!!reopenId}
        onOpenChange={(open) => !open && setReopenId(null)}
        title="Reabrir Reporte"
        description="¿Reabrir este reporte? El laboratorio podrá editarlo nuevamente."
        confirmText="Reabrir"
        isLoading={reopenMutation.isPending}
        onConfirm={() => reopenId && reopenMutation.mutate(reopenId)}
      />
    </div>
  );
}
