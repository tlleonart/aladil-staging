"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ContactStatus = "NEW" | "READ" | "ARCHIVED";

interface ContactStatusBadgeProps {
  status: ContactStatus;
}

const statusConfig: Record<
  ContactStatus,
  { label: string; className: string }
> = {
  NEW: {
    label: "New",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
  READ: {
    label: "Read",
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
};

export function ContactStatusBadge({ status }: ContactStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
