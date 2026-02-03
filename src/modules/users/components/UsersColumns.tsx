"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Pencil,
  Shield,
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
import type { User } from "../schemas";

interface UsersColumnsProps {
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  currentUserId: string;
}

export function getUsersColumns({
  onDelete,
  onToggleActive,
  currentUserId,
}: UsersColumnsProps): ColumnDef<User>[] {
  return [
    {
      accessorKey: "email",
      header: "Correo",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        return name || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "isSuperAdmin",
      header: "Rol",
      cell: ({ row }) => {
        const isSuperAdmin = row.getValue("isSuperAdmin") as boolean;
        return isSuperAdmin ? (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
            <Shield className="mr-1 h-3 w-3" />
            Super Admin
          </Badge>
        ) : (
          <Badge variant="secondary">Usuario</Badge>
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
      accessorKey: "createdAt",
      header: "Creado",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"));
        return date.toLocaleDateString();
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === currentUserId;

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
                <Link href={`/admin/users/${user.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              {!isSelf && (
                <>
                  <DropdownMenuItem onClick={() => onToggleActive(user.id)}>
                    {user.isActive ? (
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
                    onClick={() => onDelete(user.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
