"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";
import { UsersForm } from "../components";
import type { CreateUser } from "../schemas";

export function UsersCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateUser) => orpc.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario creado correctamente");
      router.push("/admin/users");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al crear el usuario"));
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Agregar Nuevo Usuario</h1>

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(createMutation.error, "Error al crear el usuario")}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersForm
            onSubmit={(data) => createMutation.mutate(data as CreateUser)}
            isLoading={createMutation.isPending}
            submitLabel="Crear Usuario"
          />
        </CardContent>
      </Card>
    </div>
  );
}
