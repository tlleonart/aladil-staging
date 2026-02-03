"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { LabsForm } from "../components";
import type { CreateLab } from "../schemas";

export function LabsCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateLab) => orpc.labs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      router.push("/admin/labs");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agregar Nuevo Laboratorio</h1>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Laboratorio</CardTitle>
        </CardHeader>
        <CardContent>
          <LabsForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            submitLabel="Crear Laboratorio"
          />
        </CardContent>
      </Card>
    </div>
  );
}
