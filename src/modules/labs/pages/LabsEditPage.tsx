"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { LabsForm } from "../components";
import type { CreateLab } from "../schemas";

interface LabsEditPageProps {
  id: string;
}

export function LabsEditPage({ id }: LabsEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: lab, isLoading } = useQuery({
    queryKey: ["labs", "detail", id],
    queryFn: () => orpc.labs.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateLab>) => orpc.labs.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      router.push("/admin/labs");
    },
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!lab) {
    return <div>Laboratorio no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Laboratorio</h1>

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
