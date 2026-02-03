"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/modules/core/auth/auth-client";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { ConfirmDialog, DataTable } from "@/modules/shared/ui";
import { getUsersColumns } from "../components";
import type { User } from "../schemas";

export function UsersListPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", "list"],
    queryFn: () => orpc.users.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orpc.users.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => orpc.users.toggleActive({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const columns = useMemo(
    () =>
      getUsersColumns({
        onDelete: setDeleteId,
        onToggleActive: (id) => toggleActiveMutation.mutate(id),
        currentUserId: session?.user?.id || "",
      }),
    [toggleActiveMutation, session?.user?.id],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Button asChild>
          <Link href="/admin/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={users as unknown as User[]}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Usuario"
        description="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
