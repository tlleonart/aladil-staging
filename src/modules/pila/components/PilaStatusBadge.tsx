"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PilaStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

interface PilaStatusBadgeProps {
  status: PilaStatus;
}

const statusConfig: Record<PilaStatus, { label: string; className: string }> = {
  DRAFT: {
    label: "Borrador",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  },
  SUBMITTED: {
    label: "Enviado",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  REVIEWED: {
    label: "Revisado",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  },
};

export function PilaStatusBadge({ status }: PilaStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={cn(config.className)}>
      {config.label}
    </Badge>
  );
}
