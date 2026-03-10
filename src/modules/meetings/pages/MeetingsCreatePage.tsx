"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";
import { MeetingsForm } from "../components";
import type { CreateMeeting } from "../schemas";

export function MeetingsCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateMeeting) => orpc.meetings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Reunión creada correctamente");
      router.push("/admin/meetings");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al crear la reunión"));
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Crear Reunión</h1>

      {createMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(createMutation.error, "Error al crear la reunión")}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Reunión</CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingsForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            submitLabel="Crear Reunión"
          />
        </CardContent>
      </Card>
    </div>
  );
}
