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
import { ExecutiveForm } from "../components";
import type { CreateExecutiveMember } from "../schemas";

interface ExecutiveEditPageProps {
  id: string;
}

export function ExecutiveEditPage({ id }: ExecutiveEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: member,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["executive", "detail", id],
    queryFn: () => orpc.executive.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateExecutiveMember>) =>
      orpc.executive.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive"] });
      toast.success("Miembro actualizado correctamente");
      router.push("/admin/executive");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al actualizar el miembro"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Editar Miembro Ejecutivo</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error
              ? getErrorMessage(error, "Error al cargar el miembro")
              : "Miembro no encontrado"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Miembro Ejecutivo</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(
              updateMutation.error,
              "Error al actualizar el miembro",
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
            defaultValues={{
              fullName: member.fullName,
              position: member.position,
              countryCode: member.countryCode,
              sortOrder: member.sortOrder,
              isActive: member.isActive,
              labId: member.labId || undefined,
              photoAssetId: member.photoAssetId || undefined,
              flagAssetId: member.flagAssetId || undefined,
            }}
            onSubmit={(data) => updateMutation.mutate(data)}
            isLoading={updateMutation.isPending}
            submitLabel="Actualizar Miembro"
          />
        </CardContent>
      </Card>
    </div>
  );
}
