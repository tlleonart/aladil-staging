import * as z from "zod";

export const LabSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  countryCode: z.string(),
  city: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  logoAssetId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateLabSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  countryCode: z.string().length(2, "Country code must be 2 characters"),
  city: z.string().optional(),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  logoAssetId: z.string().uuid().optional(),
});

export const UpdateLabSchema = CreateLabSchema.partial();

export const ListLabsQuerySchema = z.object({
  isActive: z.boolean().optional(),
  countryCode: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export type Lab = z.infer<typeof LabSchema>;
export type CreateLab = z.infer<typeof CreateLabSchema>;
export type UpdateLab = z.infer<typeof UpdateLabSchema>;
