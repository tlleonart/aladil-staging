"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { LabsForm } from "../components";
import type { CreateLab } from "../schemas";

export function LabsCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateLab) => orpc.labs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["labs"] });
      router.push("/admin/labs");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add New Lab</h1>

      <Card>
        <CardHeader>
          <CardTitle>Lab Details</CardTitle>
        </CardHeader>
        <CardContent>
          <LabsForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            submitLabel="Create Lab"
          />
        </CardContent>
      </Card>
    </div>
  );
}
