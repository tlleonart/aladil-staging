"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  ArchiveRestore,
  Eye,
  MailOpen,
  MoreHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ContactMessage } from "../schemas";

interface ContactColumnsProps {
  onView: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}

const statusConfig = {
  NEW: {
    label: "New",
    variant: "default" as const,
    className: "bg-blue-600 hover:bg-blue-600",
  },
  READ: {
    label: "Read",
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  ARCHIVED: {
    label: "Archived",
    variant: "outline" as const,
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  },
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export function getContactColumns({
  onView,
  onMarkAsRead,
  onArchive,
  onUnarchive,
}: ContactColumnsProps): ColumnDef<ContactMessage>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className={status === "NEW" ? "font-semibold" : ""}>
            {row.getValue("name")}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <a
          href={`mailto:${row.getValue("email")}`}
          className="text-blue-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {row.getValue("email")}
        </a>
      ),
    },
    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => {
        const message = row.getValue("message") as string;
        return (
          <div className="text-muted-foreground">
            {truncateText(message, 50)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as keyof typeof statusConfig;
        const config = statusConfig[status];
        return (
          <Badge variant={config.variant} className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return date.toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const message = row.original;
        const isNew = message.status === "NEW";
        const isArchived = message.status === "ARCHIVED";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(message.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {isNew && (
                <DropdownMenuItem onClick={() => onMarkAsRead(message.id)}>
                  <MailOpen className="mr-2 h-4 w-4" />
                  Mark as Read
                </DropdownMenuItem>
              )}
              {!isArchived ? (
                <DropdownMenuItem onClick={() => onArchive(message.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onUnarchive(message.id)}>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Unarchive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
