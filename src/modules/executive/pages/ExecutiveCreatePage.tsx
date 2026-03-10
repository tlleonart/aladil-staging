"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";
import { ExecutiveForm } from "../components";
import type { CreateExecutiveMember } from "../schemas";

export function ExecutiveCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateExecutiveMember) => orpc.executive.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive"] });
      toast.success("Miembro agregado correctamente");
      router.push("/admin/executive");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al agregar el miembro"));
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agregar Miembro Ejecutivo</h1>

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(
              createMutation.error,
              "Error al agregar el miembro",
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Miembro</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutiveForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            submitLabel="Agregar Miembro"
          />
        </CardContent>
      </Card>
    </div>
  );
}
