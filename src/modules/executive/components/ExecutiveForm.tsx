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
import { orpc } from "@/modules/core/orpc/client";
import { useQuery } from "@/modules/core/orpc/react";
import {
  type CreateExecutiveMember,
  CreateExecutiveMemberSchema,
} from "../schemas";

interface ExecutiveFormProps {
  defaultValues?: Partial<CreateExecutiveMember>;
  onSubmit: (data: CreateExecutiveMember) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ExecutiveForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Guardar",
}: ExecutiveFormProps) {
  // Fetch labs for the lab selector
  const { data: labs = [] } = useQuery({
    queryKey: ["labs", "list"],
    queryFn: () => orpc.labs.list({ limit: 100 }),
  });

  const form = useForm<CreateExecutiveMember>({
    resolver: zodResolver(CreateExecutiveMemberSchema),
    defaultValues: {
      fullName: "",
      position: "",
      countryCode: "",
      sortOrder: 0,
      isActive: true,
      labId: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nombre completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input
                  placeholder="ej. Presidente, Vice Presidente"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="countryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de País</FormLabel>
                <FormControl>
                  <Input placeholder="AR" maxLength={2} {...field} />
                </FormControl>
                <FormDescription>
                  Código ISO 3166-1 alpha-2 (ej. AR, UY, BR)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="labId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Laboratorio</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar laboratorio" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    {labs.map((lab) => (
                      <SelectItem key={lab.id} value={lab.id}>
                        {lab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Laboratorio asociado (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </FormControl>
                <FormDescription>Los números menores aparecen primero</FormDescription>
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

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
