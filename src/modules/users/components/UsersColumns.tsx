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

/** Shape returned by the users.list endpoint (matches userSelect) */
interface UserRow {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  labId: string | null;
  lab: { id: string; name: string } | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  memberships: Array<{
    project: { id: string; key: string; name: string };
    role: { id: string; key: string; name: string };
  }>;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  director: "Director",
  reporter: "Reportador",
  lab_reporter: "Reportador PILA",
  pila_admin: "Admin PILA",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 hover:bg-purple-100",
  director: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  reporter: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  lab_reporter: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  pila_admin: "bg-amber-100 text-amber-800 hover:bg-amber-100",
};

interface UsersColumnsProps {
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  currentUserId: string;
}

export function getUsersColumns({
  onDelete,
  onToggleActive,
  currentUserId,
}: UsersColumnsProps): ColumnDef<UserRow>[] {
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
      accessorKey: "lab",
      header: "Laboratorio",
      cell: ({ row }) => {
        const lab = row.original.lab;
        return lab?.name || <span className="text-muted-foreground">-</span>;
      },
    },
    {
      id: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const user = row.original;

        if (user.isSuperAdmin) {
          return (
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
              <Shield className="mr-1 h-3 w-3" />
              Super Admin
            </Badge>
          );
        }

        const memberships = user.memberships ?? [];
        if (memberships.length === 0) {
          return <span className="text-muted-foreground text-sm">Sin rol</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {memberships.map((m) => (
              <Badge
                key={m.project.key}
                className={ROLE_COLORS[m.role.key] ?? ""}
              >
                {ROLE_LABELS[m.role.key] ?? m.role.name}
              </Badge>
            ))}
          </div>
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
