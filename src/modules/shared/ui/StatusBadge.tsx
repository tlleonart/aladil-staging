"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  DRAFT: {
    label: "Borrador",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  PUBLISHED: {
    label: "Publicado",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  ARCHIVED: {
    label: "Archivado",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
