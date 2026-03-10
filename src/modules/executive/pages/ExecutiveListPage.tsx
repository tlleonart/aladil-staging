"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";
import { ConfirmDialog, DataTable } from "@/modules/shared/ui";
import { getExecutiveColumns } from "../components";
import type { ExecutiveMember } from "../schemas";

export function ExecutiveListPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["executive", "list"],
    queryFn: () => orpc.executive.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orpc.executive.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive"] });
      setDeleteId(null);
      toast.success("Miembro eliminado correctamente");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al eliminar el miembro"));
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => orpc.executive.toggleActive({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive"] });
      toast.success("Estado actualizado");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al cambiar el estado"));
    },
  });

  const columns = useMemo(
    () =>
      getExecutiveColumns({
        onDelete: setDeleteId,
        onToggleActive: (id) => toggleActiveMutation.mutate(id),
      }),
    [toggleActiveMutation],
  );

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Comité Ejecutivo</h1>
        <Card>
          <CardContent className="py-10 text-center text-red-600">
            <p>Error al cargar los miembros: {getErrorMessage(error)}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comité Ejecutivo</h1>
        <Button asChild>
          <Link href="/admin/executive/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Miembro
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Miembros del Comité</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={members as unknown as ExecutiveMember[]}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Miembro"
        description="¿Estás seguro de que deseas eliminar este miembro del comité ejecutivo? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
