import * as z from "zod";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { fromConvex } from "@/modules/core/orpc/errors";
import {
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import {
  CreateContactInputSchema,
  ListContactQuerySchema,
} from "../schemas";

export const list = protectedProcedure
  .input(ListContactQuerySchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.contact.list, {
        status: input.status,
        limit: input.limit,
      }),
    ),
  );

export const getById = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.contact.getById, {
        id: input.id as Id<"contactMessages">,
      }),
    ),
  );

export const markAsRead = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.contact.markAsRead, {
        id: input.id as Id<"contactMessages">,
      }),
    ),
  );

export const archive = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.contact.archive, {
        id: input.id as Id<"contactMessages">,
      }),
    ),
  );

export const unarchive = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.contact.unarchive, {
        id: input.id as Id<"contactMessages">,
      }),
    ),
  );

export const create = publicProcedure
  .input(CreateContactInputSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() => context.convex.mutation(api.contact.create, input)),
  );

export const contactRouter = {
  list,
  getById,
  markAsRead,
  archive,
  unarchive,
  create,
};
