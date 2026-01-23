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
import { getMeetingsColumns } from "../components";
import type { Meeting } from "../schemas";

export function MeetingsListPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ["meetings", "list"],
    queryFn: () => orpc.meetings.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orpc.meetings.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setDeleteId(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => orpc.meetings.publish({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => orpc.meetings.archive({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meetings</h1>
        <Button asChild>
          <Link href="/admin/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Meeting
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Meetings</CardTitle>
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
        title="Delete Meeting"
        description="Are you sure you want to delete this meeting? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
