"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { ExecutiveForm } from "../components";
import type { CreateExecutiveMember } from "../schemas";

interface ExecutiveEditPageProps {
  id: string;
}

export function ExecutiveEditPage({ id }: ExecutiveEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: member, isLoading } = useQuery({
    queryKey: ["executive", "detail", id],
    queryFn: () => orpc.executive.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateExecutiveMember>) =>
      orpc.executive.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive"] });
      router.push("/admin/executive");
    },
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!member) {
    return <div>Miembro no encontrado</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Miembro Ejecutivo</h1>

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
