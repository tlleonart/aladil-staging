"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/modules/core/orpc/client";
import { useQuery } from "@/modules/core/orpc/react";
import { type CreateMeeting, CreateMeetingSchema } from "../schemas";

// Helper to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

interface MeetingsFormProps {
  defaultValues?: Partial<CreateMeeting>;
  onSubmit: (data: CreateMeeting) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export const MeetingsForm = ({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Guardar",
}: MeetingsFormProps) => {
  // Fetch labs for the host lab selector
  const { data: labs = [] } = useQuery({
    queryKey: ["labs", "list"],
    queryFn: () => orpc.labs.list({ limit: 100 }),
  });

  const form = useForm<CreateMeeting>({
    resolver: zodResolver(CreateMeetingSchema),
    defaultValues: {
      number: 1,
      title: "",
      slug: "",
      city: "",
      country: "",
      countryCode: "",
      startDate: "",
      endDate: "",
      hostName: "",
      hostLabId: "",
      summary: "",
      content: "",
      status: "DRAFT",
      ...defaultValues,
    },
  });

  // Watch title for auto-generating slug
  const title = form.watch("title");
  const currentSlug = form.watch("slug");

  // Auto-generate slug from title when slug is empty or matches previous auto-generated value
  const handleTitleChange = useCallback(() => {
    // Only auto-generate if slug is empty or was previously auto-generated
    if (!currentSlug || currentSlug === generateSlug(form.getValues("title"))) {
      const newSlug = generateSlug(title);
      if (newSlug !== currentSlug) {
        form.setValue("slug", newSlug, { shouldValidate: false });
      }
    }
  }, [title, currentSlug, form]);

  useEffect(() => {
    // Only auto-generate slug if no defaultValues.slug was provided (new meeting)
    if (!defaultValues?.slug) {
      handleTitleChange();
    }
  }, [defaultValues?.slug, handleTitleChange]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Reunión</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="ej. 36"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="PUBLISHED">Publicado</SelectItem>
                    <SelectItem value="ARCHIVED">Archivado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder="ej. Reunión #36 | Santa Cruz de la Sierra, Bolivia"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl>
                <Input
                  placeholder="se-genera-automaticamente-del-titulo"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Se genera automáticamente del título. Puedes editarlo manualmente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Santa Cruz de la Sierra" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input placeholder="Bolivia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="countryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de País</FormLabel>
                <FormControl>
                  <Input placeholder="BO" maxLength={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Inicio</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Fin (opcional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hostLabId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Laboratorio Anfitrión</FormLabel>
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
                  Selecciona el laboratorio que organiza esta reunión
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="hostName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Anfitrión (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="O ingresa el nombre manualmente"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Usar si el anfitrión no es un laboratorio miembro
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumen</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Breve resumen de la reunión"
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contenido</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción completa de la reunión"
                  rows={10}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};
