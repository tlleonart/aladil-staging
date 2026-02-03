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
import { type CreateUser, CreateUserSchema } from "../schemas";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      email: "",
      name: "",
      password: "",
      isActive: true,
      isSuperAdmin: false,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isEdit
                  ? "Nueva Contraseña (dejar vacío para mantener la actual)"
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

        <div className="grid grid-cols-2 gap-4">
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

          <FormField
            control={form.control}
            name="isSuperAdmin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acceso de Administrador</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "true")}
                  defaultValue={field.value ? "true" : "false"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="false">Usuario Regular</SelectItem>
                    <SelectItem value="true">Super Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Los super administradores omiten todas las verificaciones RBAC
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
