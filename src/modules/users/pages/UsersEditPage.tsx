"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";
import { UsersForm } from "../components";
import type { UpdateUser } from "../schemas";

const ALADIL_LAB_ID = "00000000-0000-0000-0000-000000000001";

interface UsersEditPageProps {
  id: string;
}

export function UsersEditPage({ id }: UsersEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => orpc.users.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUser) => orpc.users.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Usuario actualizado correctamente");
      router.push("/admin/users");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al actualizar el usuario"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Editar Usuario</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error
              ? getErrorMessage(error, "Error al cargar el usuario")
              : "Usuario no encontrado"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Extract role keys from memberships
  const intranetRole = user.memberships?.find(
    (m) => m.project?.key === "INTRANET",
  )?.role?.key as "admin" | "director" | "reporter" | undefined;

  const pilaRole = user.memberships?.find((m) => m.project?.key === "PILA")
    ?.role?.key as "lab_reporter" | "pila_admin" | undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Usuario</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(
              updateMutation.error,
              "Error al actualizar el usuario",
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersForm
            defaultValues={{
              email: user.email,
              name: user.name,
              password: "",
              isActive: user.isActive,
              isSuperAdmin: user.isSuperAdmin,
              labId: user.labId || ALADIL_LAB_ID,
              roleKey: intranetRole ?? "reporter",
              pilaRoleKey: pilaRole ?? "none",
            }}
            onSubmit={(data) => updateMutation.mutate(data as UpdateUser)}
            isLoading={updateMutation.isPending}
            submitLabel="Actualizar Usuario"
            isEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}
