"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Archive, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/modules/shared/ui";
import type { Meeting } from "../schemas";

interface MeetingsColumnsProps {
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
}

export function getMeetingsColumns({
  onDelete,
  onPublish,
  onArchive,
}: MeetingsColumnsProps): ColumnDef<Meeting>[] {
  return [
    {
      accessorKey: "number",
      header: "#",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("number")}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div className="font-medium max-w-[300px] truncate">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "Location",
      cell: ({ row }) => {
        const meeting = row.original;
        return `${meeting.city}, ${meeting.country}`;
      },
    },
    {
      accessorKey: "startDate",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("startDate"));
        return date.toLocaleDateString();
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const meeting = row.original;
        const isDraft = meeting.status === "DRAFT";
        const isPublished = meeting.status === "PUBLISHED";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/meetings/${meeting.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {isDraft && (
                <DropdownMenuItem onClick={() => onPublish(meeting.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Publish
                </DropdownMenuItem>
              )}
              {isPublished && (
                <DropdownMenuItem onClick={() => onArchive(meeting.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(meeting.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
