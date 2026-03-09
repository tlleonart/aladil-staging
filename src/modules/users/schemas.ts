import * as z from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  isActive: z.boolean(),
  isSuperAdmin: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  name: z.string().min(1, "Nombre requerido").max(255),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  isActive: z.boolean(),
  isSuperAdmin: z.boolean().default(false),
  /** Lab is always required — every user belongs to a lab */
  labId: z.string().uuid("Laboratorio requerido"),
  /** Role on INTRANET project (controls sidebar visibility and general access) */
  roleKey: z.enum(["admin", "director", "reporter"]).default("reporter"),
  /** Role on PILA project (controls PILA-specific permissions) */
  pilaRoleKey: z.enum(["lab_reporter", "pila_admin", "none"]).default("none"),
});

export const UpdateUserSchema = z.object({
  email: z.string().email("Correo electrónico inválido").optional(),
  name: z.string().max(255).optional(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .optional(),
  isActive: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
  labId: z.string().uuid("Laboratorio requerido").optional(),
  roleKey: z.enum(["admin", "director", "reporter"]).optional(),
  pilaRoleKey: z.enum(["lab_reporter", "pila_admin", "none"]).optional(),
});

export const ListUsersQuerySchema = z.object({
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
