"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExecutiveMemberWithLab = {
  id: string;
  fullName: string;
  position: string;
  countryCode: string;
  sortOrder: number;
  isActive: boolean;
  labId: string | null;
  photoAssetId: string | null;
  flagAssetId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lab?: { id: string; name: string } | null;
};

interface ExecutiveColumnsProps {
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export function getExecutiveColumns({
  onDelete,
  onToggleActive,
}: ExecutiveColumnsProps): ColumnDef<ExecutiveMemberWithLab>[] {
  return [
    {
      accessorKey: "fullName",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("fullName")}</div>
      ),
    },
    {
      accessorKey: "position",
      header: "Cargo",
    },
    {
      accessorKey: "countryCode",
      header: "País",
    },
    {
      accessorKey: "lab",
      header: "Laboratorio",
      cell: ({ row }) => {
        const lab = row.original.lab;
        return lab ? (
          lab.name
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "sortOrder",
      header: "Orden",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/executive/${member.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(member.id)}>
                {member.isActive ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    Activar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(member.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
