"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { ConfirmDialog, DataTable } from "@/modules/shared/ui";
import { getLabsColumns } from "../components";
import type { Lab } from "../schemas";

export function LabsListPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: labs = [], isLoading } = useQuery({
    queryKey: ["labs", "list"],
    queryFn: () => orpc.labs.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orpc.labs.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      setDeleteId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => orpc.labs.toggleActive({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
    },
  });

  const columns = useMemo(
    () =>
      getLabsColumns({
        onDelete: setDeleteId,
        onToggleActive: (id) => toggleActiveMutation.mutate(id),
      }),
    [toggleActiveMutation],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Labs</h1>
        <Button asChild>
          <Link href="/admin/labs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Lab
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Laboratories</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={labs as unknown as Lab[]}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Lab"
        description="Are you sure you want to delete this laboratory? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
