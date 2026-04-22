import * as z from "zod";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { fromConvex } from "@/modules/core/orpc/errors";
import {
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import {
  CreateMeetingSchema,
  ListMeetingsQuerySchema,
  UpdateMeetingSchema,
} from "../schemas";

const coerceLab = (v: string | null | undefined) =>
  v ? (v as Id<"labs">) : null;
const coerceAsset = (v: string | null | undefined) =>
  v ? (v as Id<"assets">) : null;

export const list = protectedProcedure
  .input(ListMeetingsQuerySchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.meetings.list, {
        status: input.status,
        limit: input.limit,
        cursor: input.cursor,
      }),
    ),
  );

export const getById = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.meetings.getById, {
        id: input.id as Id<"meetings">,
      }),
    ),
  );

export const create = protectedProcedure
  .input(CreateMeetingSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.meetings.create, {
        number: input.number,
        title: input.title,
        slug: input.slug,
        city: input.city,
        country: input.country,
        countryCode: input.countryCode,
        startDate: input.startDate,
        endDate: input.endDate,
        hostName: input.hostName,
        hostLabId: coerceLab(input.hostLabId),
        summary: input.summary,
        content: input.content,
        status: input.status,
        coverAssetId: coerceAsset(input.coverAssetId),
        topicsPdfAssetId: coerceAsset(input.topicsPdfAssetId),
      }),
    ),
  );

export const update = protectedProcedure
  .input(z.object({ id: z.string().min(1), data: UpdateMeetingSchema }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.meetings.update, {
        id: input.id as Id<"meetings">,
        data: {
          number: input.data.number,
          title: input.data.title,
          slug: input.data.slug,
          city: input.data.city,
          country: input.data.country,
          countryCode: input.data.countryCode,
          startDate: input.data.startDate,
          endDate: input.data.endDate,
          hostName: input.data.hostName,
          hostLabId:
            input.data.hostLabId === undefined
              ? undefined
              : coerceLab(input.data.hostLabId),
          summary: input.data.summary,
          content: input.data.content,
          status: input.data.status,
          coverAssetId:
            input.data.coverAssetId === undefined
              ? undefined
              : coerceAsset(input.data.coverAssetId),
          topicsPdfAssetId:
            input.data.topicsPdfAssetId === undefined
              ? undefined
              : coerceAsset(input.data.topicsPdfAssetId),
        },
      }),
    ),
  );

export const remove = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.meetings.remove, {
        id: input.id as Id<"meetings">,
      }),
    ),
  );

export const publish = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.meetings.publish, {
        id: input.id as Id<"meetings">,
      }),
    ),
  );

export const archive = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.meetings.archive, {
        id: input.id as Id<"meetings">,
      }),
    ),
  );

export const listPublished = publicProcedure
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).default(50),
      cursor: z.string().min(1).optional(),
    }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.meetings.listPublished, input),
    ),
  );

export const getBySlug = publicProcedure
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input, context }) =>
    fromConvex(() => context.convex.query(api.meetings.getBySlug, input)),
  );

export const meetingsRouter = {
  list,
  getById,
  create,
  update,
  remove,
  publish,
  archive,
  listPublished,
  getBySlug,
};
