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
import type { Lab } from "../schemas";

interface LabsColumnsProps {
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export function getLabsColumns({
  onDelete,
  onToggleActive,
}: LabsColumnsProps): ColumnDef<Lab>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "countryCode",
      header: "País",
      cell: ({ row }) => {
        const lab = row.original;
        return (
          <span>
            {lab.city ? `${lab.city}, ` : ""}
            {lab.countryCode}
          </span>
        );
      },
    },
    {
      accessorKey: "websiteUrl",
      header: "Sitio Web",
      cell: ({ row }) => {
        const url = row.getValue("websiteUrl") as string | null;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate max-w-[200px] block"
          >
            {url.replace(/^https?:\/\//, "")}
          </a>
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
        const lab = row.original;

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
                <Link href={`/admin/labs/${lab.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(lab.id)}>
                {lab.isActive ? (
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
                onClick={() => onDelete(lab.id)}
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
