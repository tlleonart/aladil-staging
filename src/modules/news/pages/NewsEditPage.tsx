"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";
import { NewsForm } from "../components";
import type { CreateNewsPost } from "../schemas";

interface NewsEditPageProps {
  id: string;
}

export function NewsEditPage({ id }: NewsEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["news", "detail", id],
    queryFn: () => orpc.news.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateNewsPost>) =>
      orpc.news.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success("Noticia actualizada correctamente");
      router.push("/admin/news");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al actualizar la noticia"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Editar Noticia</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error
              ? getErrorMessage(error, "Error al cargar la noticia")
              : "Noticia no encontrada"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Noticia</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(
              updateMutation.error,
              "Error al actualizar la noticia",
            )}
          </AlertDescription>
        </Alert>
      )}

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
              authorName: post.authorName || undefined,
              publishedAt: post.publishedAt
                ? new Date(post.publishedAt).toISOString().slice(0, 16)
                : undefined,
            }}
            onSubmit={(data) => updateMutation.mutate(data)}
            isLoading={updateMutation.isPending}
            submitLabel="Actualizar Noticia"
            currentCoverAsset={post.coverAsset ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
