"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";
import { NewsForm } from "../components";
import type { CreateNewsPost } from "../schemas";

export function NewsCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateNewsPost) => orpc.news.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      toast.success("Noticia creada correctamente");
      router.push("/admin/news");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al crear la noticia"));
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Crear Noticia</h1>

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(createMutation.error, "Error al crear la noticia")}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Noticia</CardTitle>
        </CardHeader>
        <CardContent>
          <NewsForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            submitLabel="Crear Noticia"
          />
        </CardContent>
      </Card>
    </div>
  );
}
