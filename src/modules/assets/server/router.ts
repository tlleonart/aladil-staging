import * as z from "zod";
import { prisma } from "@/modules/core/db";
import { ORPCError, protectedProcedure } from "@/modules/core/orpc/server";
import { CreateAssetSchema } from "../schemas";

// Create asset record (after file is uploaded to storage)
export const create = protectedProcedure
  .input(CreateAssetSchema)
  .handler(async ({ input, context }) => {
    const asset = await prisma.asset.create({
      data: {
        type: input.type,
        bucket: input.bucket,
        path: input.path,
        filename: input.filename,
        mimeType: input.mimeType || null,
        sizeBytes: input.size || null,
        uploadedById: context.user.id,
      },
    });

    return asset;
  });

// Get asset by ID
export const getById = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const asset = await prisma.asset.findUnique({
      where: { id: input.id },
    });

    if (!asset) {
      throw new ORPCError("NOT_FOUND", { message: "Asset no encontrado" });
    }

    return asset;
  });

// Delete asset
export const remove = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const asset = await prisma.asset.findUnique({
      where: { id: input.id },
    });

    if (!asset) {
      throw new ORPCError("NOT_FOUND", { message: "Asset no encontrado" });
    }

    await prisma.asset.delete({ where: { id: input.id } });

    return { success: true, path: asset.path, bucket: asset.bucket };
  });

// List assets
export const list = protectedProcedure
  .input(
    z.object({
      type: z.enum(["IMAGE", "PDF", "OTHER"]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .handler(async ({ input }) => {
    const assets = await prisma.asset.findMany({
      where: input.type ? { type: input.type } : undefined,
      orderBy: { createdAt: "desc" },
      take: input.limit,
    });

    return assets;
  });

export const assetsRouter = {
  create,
  getById,
  remove,
  list,
};
