"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { UsersForm } from "../components";
import type { UpdateUser } from "../schemas";

interface UsersEditPageProps {
  id: string;
}

export function UsersEditPage({ id }: UsersEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => orpc.users.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUser) => orpc.users.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      router.push("/admin/users");
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit User</h1>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersForm
            defaultValues={{
              email: user.email,
              name: user.name,
              password: "",
              isActive: user.isActive,
              isSuperAdmin: user.isSuperAdmin,
            }}
            onSubmit={(data) => updateMutation.mutate(data as UpdateUser)}
            isLoading={updateMutation.isPending}
            submitLabel="Update User"
            isEdit
          />
        </CardContent>
      </Card>
    </div>
  );
}
