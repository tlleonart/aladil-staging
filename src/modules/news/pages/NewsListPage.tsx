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
import { getNewsColumns } from "../components";
import type { NewsPost } from "../schemas";

export function NewsListPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["news", "list"],
    queryFn: () => orpc.news.list({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orpc.news.remove({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setDeleteId(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => orpc.news.publish({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => orpc.news.archive({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });

  const columns = useMemo(
    () =>
      getNewsColumns({
        onDelete: setDeleteId,
        onPublish: (id) => publishMutation.mutate(id),
        onArchive: (id) => archiveMutation.mutate(id),
      }),
    [publishMutation, archiveMutation],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">News</h1>
        <Button asChild>
          <Link href="/admin/news/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={posts as unknown as NewsPost[]}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete News Post"
        description="Are you sure you want to delete this news post? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
