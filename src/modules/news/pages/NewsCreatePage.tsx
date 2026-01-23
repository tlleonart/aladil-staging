"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { NewsForm } from "../components";
import type { CreateNewsPost } from "../schemas";

export function NewsCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateNewsPost) => orpc.news.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      router.push("/admin/news");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create News Post</h1>

      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewsForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            submitLabel="Create Post"
          />
        </CardContent>
      </Card>
    </div>
  );
}
