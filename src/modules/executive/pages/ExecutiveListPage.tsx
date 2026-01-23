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
import { getExecutiveColumns } from "../components";
import type { ExecutiveMember } from "../schemas";

export function ExecutiveListPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["executive", "list"],
    queryFn: () => orpc.executive.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orpc.executive.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive"] });
      setDeleteId(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => orpc.executive.toggleActive({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive"] });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Executive Committee</h1>
        <Button asChild>
          <Link href="/admin/executive/new">
            <Plus className="mr-2 h-4 w-4" />
            New Member
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Committee Members</CardTitle>
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
        title="Delete Member"
        description="Are you sure you want to delete this executive committee member? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
