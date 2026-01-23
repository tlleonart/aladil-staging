import * as z from "zod";

export const NewsPostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  excerpt: z.string().nullable(),
  content: z.any().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  coverAssetId: z.string().uuid().nullable(),
  authorId: z.string().uuid().nullable(),
  publishedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateNewsPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().max(255).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.any().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  coverAssetId: z.string().uuid().optional(),
});

export const UpdateNewsPostSchema = CreateNewsPostSchema.partial();

export const ListNewsQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export type NewsPost = z.infer<typeof NewsPostSchema>;
export type CreateNewsPost = z.infer<typeof CreateNewsPostSchema>;
export type UpdateNewsPost = z.infer<typeof UpdateNewsPostSchema>;
