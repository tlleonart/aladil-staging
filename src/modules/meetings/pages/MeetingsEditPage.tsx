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
import { MeetingsForm } from "../components";
import type { CreateMeeting } from "../schemas";

interface MeetingsEditPageProps {
  id: string;
}

export function MeetingsEditPage({ id }: MeetingsEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: meeting,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["meetings", "detail", id],
    queryFn: () => orpc.meetings.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateMeeting>) =>
      orpc.meetings.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Reunión actualizada correctamente");
      router.push("/admin/meetings");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "Error al actualizar la reunión"));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Editar Reunión</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error
              ? getErrorMessage(error, "Error al cargar la reunión")
              : "Reunión no encontrada"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Format dates for the form
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Reunión</h1>

      {updateMutation.error && (
        <Alert variant="destructive">
          <AlertDescription>
            {getErrorMessage(
              updateMutation.error,
              "Error al actualizar la reunión",
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Reunión</CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingsForm
            defaultValues={{
              number: meeting.number,
              title: meeting.title,
              slug: meeting.slug,
              city: meeting.city,
              country: meeting.country,
              countryCode: meeting.countryCode,
              startDate: formatDate(meeting.startDate),
              endDate: formatDate(meeting.endDate),
              hostName: meeting.hostName || "",
              hostLabId: meeting.hostLabId || undefined,
              summary: meeting.summary || "",
              content: meeting.content || "",
              status: meeting.status,
              coverAssetId: meeting.coverAssetId || undefined,
              topicsPdfAssetId: meeting.topicsPdfAssetId || undefined,
            }}
            onSubmit={(data) => updateMutation.mutate(data)}
            isLoading={updateMutation.isPending}
            submitLabel="Actualizar Reunión"
          />
        </CardContent>
      </Card>
    </div>
  );
}
