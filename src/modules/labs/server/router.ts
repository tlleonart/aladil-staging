import * as z from "zod";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { fromConvex } from "@/modules/core/orpc/errors";
import {
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import {
  CreateLabSchema,
  ListLabsQuerySchema,
  UpdateLabSchema,
} from "../schemas";

export const publicList = publicProcedure
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).default(50),
    }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.labs.publicList, { limit: input.limit }),
    ),
  );

export const list = protectedProcedure
  .input(ListLabsQuerySchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.labs.list, {
        isActive: input.isActive,
        countryCode: input.countryCode,
        limit: input.limit,
        cursor: input.cursor,
      }),
    ),
  );

export const getById = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.labs.getById, { id: input.id as Id<"labs"> }),
    ),
  );

export const create = protectedProcedure
  .input(CreateLabSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.labs.create, {
        name: input.name,
        countryCode: input.countryCode,
        city: input.city ?? undefined,
        websiteUrl: input.websiteUrl ?? null,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
        logoAssetId: input.logoAssetId
          ? (input.logoAssetId as Id<"assets">)
          : null,
      }),
    ),
  );

export const update = protectedProcedure
  .input(
    z.object({
      id: z.string().min(1),
      data: UpdateLabSchema,
    }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.labs.update, {
        id: input.id as Id<"labs">,
        data: {
          name: input.data.name,
          countryCode: input.data.countryCode,
          city: input.data.city,
          websiteUrl: input.data.websiteUrl,
          isActive: input.data.isActive,
          sortOrder: input.data.sortOrder,
          logoAssetId:
            input.data.logoAssetId === undefined
              ? undefined
              : input.data.logoAssetId
                ? (input.data.logoAssetId as Id<"assets">)
                : null,
        },
      }),
    ),
  );

export const remove = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.labs.remove, {
        id: input.id as Id<"labs">,
      }),
    ),
  );

export const toggleActive = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.labs.toggleActive, {
        id: input.id as Id<"labs">,
      }),
    ),
  );

export const labsRouter = {
  publicList,
  list,
  getById,
  create,
  update,
  remove,
  toggleActive,
};
