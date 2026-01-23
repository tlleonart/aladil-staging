"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActiveBadgeProps {
  isActive: boolean;
}

export function ActiveBadge({ isActive }: ActiveBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        isActive
          ? "bg-green-100 text-green-800 hover:bg-green-100"
          : "bg-red-100 text-red-800 hover:bg-red-100",
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
