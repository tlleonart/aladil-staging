"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { PilaReportForm } from "../components";
import type { CreatePilaReport } from "../schemas";

export function PilaCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreatePilaReport) => orpc.pila.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila"] });
      router.push("/admin/pila");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nuevo Reporte PILA</h1>

      {createMutation.error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {(createMutation.error as { message?: string })?.message ||
            "Error al crear el reporte"}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Indicadores del Período</CardTitle>
        </CardHeader>
        <CardContent>
          <PilaReportForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            submitLabel="Guardar Borrador"
          />
        </CardContent>
      </Card>
    </div>
  );
}
