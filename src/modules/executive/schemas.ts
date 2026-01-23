import * as z from "zod";

export const ExecutiveMemberSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  position: z.string(),
  countryCode: z.string(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  labId: z.string().uuid().nullable(),
  photoAssetId: z.string().uuid().nullable(),
  flagAssetId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateExecutiveMemberSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  position: z.string().min(1, "Position is required").max(255),
  countryCode: z.string().length(2, "Country code must be 2 characters"),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  labId: z.string().uuid().optional(),
  photoAssetId: z.string().uuid().optional(),
  flagAssetId: z.string().uuid().optional(),
});

export const UpdateExecutiveMemberSchema =
  CreateExecutiveMemberSchema.partial();

export const ListExecutiveQuerySchema = z.object({
  isActive: z.boolean().optional(),
  countryCode: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export type ExecutiveMember = z.infer<typeof ExecutiveMemberSchema>;
export type CreateExecutiveMember = z.infer<typeof CreateExecutiveMemberSchema>;
export type UpdateExecutiveMember = z.infer<typeof UpdateExecutiveMemberSchema>;
