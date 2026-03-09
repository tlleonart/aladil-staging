"use client";

import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { UsersForm } from "../components";
import type { UpdateUser } from "../schemas";

const ALADIL_LAB_ID = "00000000-0000-0000-0000-000000000001";

interface UsersEditPageProps {
  id: string;
}

export function UsersEditPage({ id }: UsersEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => orpc.users.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUser) => orpc.users.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      router.push("/admin/users");
    },
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <div>Usuario no encontrado</div>;
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
            {updateMutation.error.message || "Error al actualizar el usuario"}
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
