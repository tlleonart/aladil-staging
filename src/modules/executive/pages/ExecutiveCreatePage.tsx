"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation, useQueryClient } from "@/modules/core/orpc/react";
import { ExecutiveForm } from "../components";
import type { CreateExecutiveMember } from "../schemas";

export function ExecutiveCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateExecutiveMember) => orpc.executive.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executive"] });
      router.push("/admin/executive");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Add Executive Member</h1>

      <Card>
        <CardHeader>
          <CardTitle>Member Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExecutiveForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
            submitLabel="Add Member"
          />
        </CardContent>
      </Card>
    </div>
  );
}
