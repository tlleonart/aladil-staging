"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { orpc } from "@/modules/core/orpc/client";
import { useQuery } from "@/modules/core/orpc/react";
import { type CreateUser, CreateUserSchema } from "../schemas";

const ALADIL_LAB_ID = "00000000-0000-0000-0000-000000000001";

interface UsersFormProps {
  defaultValues?: Partial<CreateUser>;
  onSubmit: (data: CreateUser) => void;
  isLoading?: boolean;
  submitLabel?: string;
  isEdit?: boolean;
}

export function UsersForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Guardar",
  isEdit = false,
}: UsersFormProps) {
  const schema = isEdit
    ? CreateUserSchema.extend({
        password: CreateUserSchema.shape.password.optional(),
      })
    : CreateUserSchema;

  const form = useForm<CreateUser>({
    // biome-ignore lint/suspicious/noExplicitAny: RHF resolver type mismatch
    resolver: zodResolver(schema) as any,
    defaultValues: {
      email: "",
      name: "",
      password: "",
      isActive: true,
      isSuperAdmin: false,
      labId: ALADIL_LAB_ID,
      roleKey: "reporter",
      pilaRoleKey: "none",
      ...defaultValues,
    },
  });

  // Fetch labs for the dropdown
  const { data: labs = [] } = useQuery({
    queryKey: ["labs", "list"],
    queryFn: () => orpc.labs.list({ limit: 100 }),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Datos básicos ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEdit
                  ? "Nueva Contraseña (dejar vacío para mantener)"
                  : "Contraseña"}
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormDescription>
                {isEdit
                  ? "Dejar vacío para mantener la contraseña actual"
                  : "Mínimo 8 caracteres"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Laboratorio y Estado ────────────────────────────── */}
        <Separator />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="labId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Laboratorio</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || ALADIL_LAB_ID}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar laboratorio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {labs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Todo usuario debe pertenecer a un laboratorio
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "true")}
                  defaultValue={field.value ? "true" : "false"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Roles ──────────────────────────────────────────── */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Roles y Permisos
          </h3>
          <p className="text-sm text-muted-foreground">
            Un usuario puede tener un rol por módulo. El rol principal controla
            el acceso general a la intranet y el rol PILA controla el acceso al
            programa de indicadores.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="roleKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol Principal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "reporter"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="reporter">Reportador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Admin: edición total. Director: lectura de todos los
                    módulos. Reportador: solo PILA.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pilaRoleKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol PILA</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin rol PILA" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin rol PILA</SelectItem>
                      <SelectItem value="lab_reporter">
                        Reportador PILA
                      </SelectItem>
                      <SelectItem value="pila_admin">
                        Administrador PILA
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Reportador: carga reportes de su lab. Admin PILA: ve y
                    gestiona todos los reportes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
