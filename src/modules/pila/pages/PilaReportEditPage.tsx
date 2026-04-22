"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { PilaReportForm, PilaStatusBadge } from "../components";
import type { UpdatePilaReport } from "../schemas";

interface PilaReportEditPageProps {
  id: string;
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

export function PilaReportEditPage({ id }: PilaReportEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useQuery({
    queryKey: ["pila", "detail", id],
    queryFn: () => orpc.pila.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePilaReport) => orpc.pila.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila"] });
      router.push("/admin/pila");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando reporte...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reporte no encontrado</h1>
        <Button asChild variant="outline">
          <Link href="/admin/pila">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>
    );
  }

  const isDraft = report.status === "DRAFT";
  const monthName = MONTHS[report.month - 1];

  // Map report values for the form
  const defaultValues = (report.values ?? [])
    .filter((v) => v.indicator)
    .map((v) => ({
      indicatorId: v.indicator!.id,
      numerator: v.numerator,
      denominator: v.denominator,
      doesNotReport: v.doesNotReport ?? false,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/pila">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Reporte {monthName} {report.year}
            </h1>
            <p className="text-sm text-muted-foreground">{report.lab?.name}</p>
          </div>
        </div>
        <PilaStatusBadge
          status={report.status as "DRAFT" | "SUBMITTED" | "REVIEWED"}
        />
      </div>

      {updateMutation.error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {(updateMutation.error as { message?: string })?.message ||
            "Error al actualizar el reporte"}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {isDraft ? "Editar Indicadores" : "Indicadores (Solo lectura)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PilaReportForm
            defaultValues={defaultValues}
            defaultNotes={report.notes || ""}
            defaultYear={report.year}
            defaultMonth={report.month}
            onSubmit={(data) =>
              updateMutation.mutate({
                values: data.values,
                notes: data.notes,
              })
            }
            isLoading={updateMutation.isPending}
            submitLabel="Guardar Cambios"
            readOnly={!isDraft}
            hideYearMonth
          />
        </CardContent>
      </Card>
    </div>
  );
}
