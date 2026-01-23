"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { MeetingsForm } from "../components";
import type { CreateMeeting } from "../schemas";

interface MeetingsEditPageProps {
  id: string;
}

export function MeetingsEditPage({ id }: MeetingsEditPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meetings", "detail", id],
    queryFn: () => orpc.meetings.getById({ id }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateMeeting>) =>
      orpc.meetings.update({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      router.push("/admin/meetings");
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!meeting) {
    return <div>Meeting not found</div>;
  }

  // Format dates for the form
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Meeting</h1>

      <Card>
        <CardHeader>
          <CardTitle>Meeting Details</CardTitle>
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
            submitLabel="Update Meeting"
          />
        </CardContent>
      </Card>
    </div>
  );
}
