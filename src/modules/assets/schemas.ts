import * as z from "zod";

export const AssetSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["IMAGE", "PDF", "OTHER"]),
  bucket: z.string(),
  path: z.string(),
  filename: z.string(),
  mimeType: z.string().nullable(),
  size: z.number().nullable(),
  uploadedById: z.string().min(1).nullable(),
  createdAt: z.date(),
});

export const CreateAssetSchema = z.object({
  type: z.enum(["IMAGE", "PDF", "OTHER"]),
  bucket: z.string(),
  path: z.string(),
  filename: z.string(),
  mimeType: z.string().optional(),
  size: z.number().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;
export type CreateAsset = z.infer<typeof CreateAssetSchema>;
