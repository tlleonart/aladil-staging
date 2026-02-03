"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { NewsForm } from "../components";
import type { CreateNewsPost } from "../schemas";

interface NewsEditPageProps {
  id: string;
}

export function NewsEditPage({ id }: NewsEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ["news", "detail", id],
    queryFn: () => orpc.news.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateNewsPost>) =>
      orpc.news.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      router.push("/admin/news");
    },
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!post) {
    return <div>Noticia no encontrada</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Noticia</h1>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Noticia</CardTitle>
        </CardHeader>
        <CardContent>
          <NewsForm
            defaultValues={{
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt || "",
              content: post.content || "",
              status: post.status,
              coverAssetId: post.coverAssetId || undefined,
            }}
            onSubmit={(data) => updateMutation.mutate(data)}
            isLoading={updateMutation.isPending}
            submitLabel="Actualizar Noticia"
          />
        </CardContent>
      </Card>
    </div>
  );
}
