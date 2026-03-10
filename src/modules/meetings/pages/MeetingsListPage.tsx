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
import { getMeetingsColumns } from "../components";
import type { Meeting } from "../schemas";

export function MeetingsListPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: meetings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["meetings", "list"],
    queryFn: () => orpc.meetings.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orpc.meetings.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setDeleteId(null);
      toast.success("Reunión eliminada correctamente");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al eliminar la reunión"));
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => orpc.meetings.publish({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Reunión publicada correctamente");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al publicar la reunión"));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => orpc.meetings.archive({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Reunión archivada correctamente");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al archivar la reunión"));
    },
  });

  const columns = useMemo(
    () =>
      getMeetingsColumns({
        onDelete: setDeleteId,
        onPublish: (id) => publishMutation.mutate(id),
        onArchive: (id) => archiveMutation.mutate(id),
      }),
    [publishMutation, archiveMutation],
  );

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reuniones</h1>
        <Card>
          <CardContent className="py-10 text-center text-red-600">
            <p>Error al cargar las reuniones: {getErrorMessage(error)}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reuniones</h1>
        <Button asChild>
          <Link href="/admin/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reunión
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Reuniones</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={meetings as unknown as Meeting[]}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Reunión"
        description="¿Estás seguro de que deseas eliminar esta reunión? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
