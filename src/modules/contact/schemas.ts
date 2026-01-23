import * as z from "zod";

export const ContactMessageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  message: z.string(),
  status: z.enum(["NEW", "READ", "ARCHIVED"]),
  createdAt: z.date(),
});

export const ListContactQuerySchema = z.object({
  status: z.enum(["NEW", "READ", "ARCHIVED"]).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export const CreateContactInputSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email invalido"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export type ContactMessage = z.infer<typeof ContactMessageSchema>;
export type CreateContactInput = z.infer<typeof CreateContactInputSchema>;
