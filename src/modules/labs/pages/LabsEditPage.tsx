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
import { LabsForm } from "../components";
import type { CreateLab } from "../schemas";

interface LabsEditPageProps {
  id: string;
}

export function LabsEditPage({ id }: LabsEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: lab,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["labs", "detail", id],
    queryFn: () => orpc.labs.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateLab>) => orpc.labs.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      toast.success("Laboratorio actualizado correctamente");
      router.push("/admin/labs");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al actualizar el laboratorio"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !lab) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Editar Laboratorio</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error
              ? getErrorMessage(error, "Error al cargar el laboratorio")
              : "Laboratorio no encontrado"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Laboratorio</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(
              updateMutation.error,
              "Error al actualizar el laboratorio",
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Laboratorio</CardTitle>
        </CardHeader>
        <CardContent>
          <LabsForm
            defaultValues={{
              name: lab.name,
              countryCode: lab.countryCode,
              city: lab.city || "",
              websiteUrl: lab.websiteUrl || "",
              isActive: lab.isActive,
              sortOrder: lab.sortOrder,
              logoAssetId: lab.logoAssetId || undefined,
            }}
            onSubmit={(data) => updateMutation.mutate(data)}
            isLoading={updateMutation.isPending}
            submitLabel="Actualizar Laboratorio"
          />
        </CardContent>
      </Card>
    </div>
  );
}
