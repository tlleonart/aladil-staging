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
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isActive: z.boolean(),
  isSuperAdmin: z.boolean(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  name: z.string().max(255).optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  isActive: z.boolean().optional(),
  isSuperAdmin: z.boolean().optional(),
});

export const ListUsersQuerySchema = z.object({
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
