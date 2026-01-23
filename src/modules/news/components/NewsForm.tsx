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
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/modules/shared/ui/RichTextEditor";
import { type CreateNewsPost, CreateNewsPostSchema } from "../schemas";

interface NewsFormProps {
  defaultValues?: Partial<CreateNewsPost>;
  onSubmit: (data: CreateNewsPost) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function NewsForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Guardar",
}: NewsFormProps) {
  const form = useForm<CreateNewsPost>({
    resolver: zodResolver(CreateNewsPostSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      status: "DRAFT",
      ...defaultValues,
    },
  });

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ingrese el título de la noticia"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // Auto-generate slug if slug is empty
                      const currentSlug = form.getValues("slug");
                      if (!currentSlug) {
                        form.setValue("slug", generateSlug(e.target.value));
                      }
                    }}
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
                Se genera automáticamente del título. Puedes editarlo
                manualmente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumen</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Breve resumen de la noticia (aparece en listados)"
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Máximo 500 caracteres. Se muestra en la vista previa de la
                noticia.
              </FormDescription>
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
                <RichTextEditor
                  content={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Escribe el contenido completo de la noticia..."
                />
              </FormControl>
              <FormDescription>
                Usa el editor para dar formato al contenido. Puedes agregar
                títulos, listas, imágenes y enlaces.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 pt-4 border-t">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isLoading}
          >
            Limpiar
          </Button>
        </div>
      </form>
    </Form>
  );
}
