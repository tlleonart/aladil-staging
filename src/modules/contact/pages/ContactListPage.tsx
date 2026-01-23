"use client";

import { useCallback, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { DataTable } from "@/modules/shared/ui";
import { ContactDetailDialog, getContactColumns } from "../components";
import type { ContactMessage } from "../schemas";

export const ContactListPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMessage, setViewMessage] = useState<ContactMessage | null>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["contact", "list", statusFilter],
    queryFn: () =>
      orpc.contact.list({
        limit: 100,
        ...(statusFilter !== "all" && {
          status: statusFilter as "NEW" | "READ" | "ARCHIVED",
        }),
      }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => orpc.contact.markAsRead({ id }),
    onSuccess: (updatedMessage) => {
      queryClient.invalidateQueries({ queryKey: ["contact"] });
      // Update the dialog state with the new status
      if (viewMessage && viewMessage.id === updatedMessage.id) {
        setViewMessage({ ...viewMessage, status: "READ" });
      }
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => orpc.contact.archive({ id }),
    onSuccess: (updatedMessage) => {
      queryClient.invalidateQueries({ queryKey: ["contact"] });
      // Update the dialog state with the new status
      if (viewMessage && viewMessage.id === updatedMessage.id) {
        setViewMessage({ ...viewMessage, status: "ARCHIVED" });
      }
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => orpc.contact.unarchive({ id }),
    onSuccess: (updatedMessage) => {
      queryClient.invalidateQueries({ queryKey: ["contact"] });
      // Update the dialog state with the new status
      if (viewMessage && viewMessage.id === updatedMessage.id) {
        setViewMessage({ ...viewMessage, status: "READ" });
      }
    },
  });

  const handleView = useCallback(
    (id: string) => {
      const message = messages.find((m: { id: string }) => m.id === id);
      if (message) {
        setViewMessage(message as unknown as ContactMessage);
        // Mark as read when viewing
        if (message.status === "NEW") {
          markAsReadMutation.mutate(id);
        }
      }
    },
    [messages, markAsReadMutation],
  );

  const handleRowClick = useCallback(
    (row: ContactMessage) => {
      handleView(row.id);
    },
    [handleView],
  );

  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id);
    },
    [markAsReadMutation],
  );

  const handleArchive = useCallback(
    (id: string) => {
      archiveMutation.mutate(id);
    },
    [archiveMutation],
  );

  const handleUnarchive = useCallback(
    (id: string) => {
      unarchiveMutation.mutate(id);
    },
    [unarchiveMutation],
  );

  const columns = useMemo(
    () =>
      getContactColumns({
        onView: handleView,
        onMarkAsRead: handleMarkAsRead,
        onArchive: handleArchive,
        onUnarchive: handleUnarchive,
      }),
    [handleView, handleMarkAsRead, handleArchive, handleUnarchive],
  );

  const newCount = messages.filter(
    (m: { status: string }) => m.status === "NEW",
  ).length;
  const isMutating =
    markAsReadMutation.isPending ||
    archiveMutation.isPending ||
    unarchiveMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Contact Messages</h1>
          {newCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
              {newCount} new
            </span>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="READ">Read</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={messages as unknown as ContactMessage[]}
            isLoading={isLoading}
            onRowClick={handleRowClick}
          />
        </CardContent>
      </Card>

      <ContactDetailDialog
        message={viewMessage}
        open={!!viewMessage}
        onOpenChange={(open) => !open && setViewMessage(null)}
        onMarkAsRead={handleMarkAsRead}
        onArchive={handleArchive}
        onUnarchive={handleUnarchive}
        isLoading={isMutating}
      />
    </div>
  );
};
