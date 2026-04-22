import * as z from "zod";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { fromConvex } from "@/modules/core/orpc/errors";
import {
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import {
  CreateExecutiveMemberSchema,
  ListExecutiveQuerySchema,
  UpdateExecutiveMemberSchema,
} from "../schemas";

const coerceAssetId = (v: string | null | undefined) =>
  v ? (v as Id<"assets">) : null;
const coerceLabId = (v: string | null | undefined) =>
  v ? (v as Id<"labs">) : null;

export const list = protectedProcedure
  .input(ListExecutiveQuerySchema)
  .handler(async ({ input, context }) =>
    fromConvex(() => context.convex.query(api.executive.list, input)),
  );

export const getById = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.executive.getById, {
        id: input.id as Id<"executiveMembers">,
      }),
    ),
  );

export const create = protectedProcedure
  .input(CreateExecutiveMemberSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.executive.create, {
        fullName: input.fullName,
        position: input.position,
        countryCode: input.countryCode,
        sortOrder: input.sortOrder,
        isActive: input.isActive,
        labId: coerceLabId(input.labId),
        photoAssetId: coerceAssetId(input.photoAssetId),
        flagAssetId: coerceAssetId(input.flagAssetId),
      }),
    ),
  );

export const update = protectedProcedure
  .input(
    z.object({
      id: z.string().min(1),
      data: UpdateExecutiveMemberSchema,
    }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.executive.update, {
        id: input.id as Id<"executiveMembers">,
        data: {
          fullName: input.data.fullName,
          position: input.data.position,
          countryCode: input.data.countryCode,
          sortOrder: input.data.sortOrder,
          isActive: input.data.isActive,
          labId:
            input.data.labId === undefined
              ? undefined
              : coerceLabId(input.data.labId),
          photoAssetId:
            input.data.photoAssetId === undefined
              ? undefined
              : coerceAssetId(input.data.photoAssetId),
          flagAssetId:
            input.data.flagAssetId === undefined
              ? undefined
              : coerceAssetId(input.data.flagAssetId),
        },
      }),
    ),
  );

export const remove = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.executive.remove, {
        id: input.id as Id<"executiveMembers">,
      }),
    ),
  );

export const toggleActive = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.executive.toggleActive, {
        id: input.id as Id<"executiveMembers">,
      }),
    ),
  );

export const listPublic = publicProcedure
  .input(
    z.object({ limit: z.number().int().min(1).max(100).default(50) }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() => context.convex.query(api.executive.listPublic, input)),
  );

export const executiveRouter = {
  listPublic,
  list,
  getById,
  create,
  update,
  remove,
  toggleActive,
};
