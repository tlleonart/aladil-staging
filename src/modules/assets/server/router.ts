import * as z from "zod";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { fromConvex } from "@/modules/core/orpc/errors";
import { protectedProcedure } from "@/modules/core/orpc/server";

export const create = protectedProcedure
  .input(
    z.object({
      type: z.enum(["IMAGE", "PDF", "OTHER"]),
      storageId: z.string().min(1),
      filename: z.string().min(1),
      mimeType: z.string().optional(),
      size: z.number().int().optional(),
    }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.assets.create, {
        type: input.type,
        storageId: input.storageId as Id<"_storage">,
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.size,
      }),
    ),
  );

export const getById = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.assets.getById, {
        id: input.id as Id<"assets">,
      }),
    ),
  );

export const remove = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.assets.remove, {
        id: input.id as Id<"assets">,
      }),
    ),
  );

export const list = protectedProcedure
  .input(
    z.object({
      type: z.enum(["IMAGE", "PDF", "OTHER"]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.assets.list, {
        type: input.type,
        limit: input.limit,
      }),
    ),
  );

export const assetsRouter = {
  create,
  getById,
  remove,
  list,
};
