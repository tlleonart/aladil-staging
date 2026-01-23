"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { MeetingsForm } from "../components";
import type { CreateMeeting } from "../schemas";

export function MeetingsCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateMeeting) => orpc.meetings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      router.push("/admin/meetings");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create Meeting</h1>

      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingsForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            submitLabel="Create Meeting"
          />
        </CardContent>
      </Card>
    </div>
  );
}
