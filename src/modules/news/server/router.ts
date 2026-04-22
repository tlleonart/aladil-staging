import * as z from "zod";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { fromConvex } from "@/modules/core/orpc/errors";
import {
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import {
  CreateNewsPostSchema,
  ListNewsQuerySchema,
  UpdateNewsPostSchema,
} from "../schemas";

const coerceAsset = (v: string | null | undefined) =>
  v ? (v as Id<"assets">) : null;

export const list = protectedProcedure
  .input(ListNewsQuerySchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.query(api.news.list, {
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
      context.convex.query(api.news.getById, {
        id: input.id as Id<"newsPosts">,
      }),
    ),
  );

export const create = protectedProcedure
  .input(CreateNewsPostSchema)
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.news.create, {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        status: input.status,
        coverAssetId: coerceAsset(input.coverAssetId),
        authorName: input.authorName,
        publishedAt: input.publishedAt,
      }),
    ),
  );

export const update = protectedProcedure
  .input(z.object({ id: z.string().min(1), data: UpdateNewsPostSchema }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.news.update, {
        id: input.id as Id<"newsPosts">,
        data: {
          title: input.data.title,
          slug: input.data.slug,
          excerpt: input.data.excerpt,
          content: input.data.content,
          status: input.data.status,
          coverAssetId:
            input.data.coverAssetId === undefined
              ? undefined
              : coerceAsset(input.data.coverAssetId),
          authorName: input.data.authorName,
          publishedAt: input.data.publishedAt,
        },
      }),
    ),
  );

export const remove = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.news.remove, {
        id: input.id as Id<"newsPosts">,
      }),
    ),
  );

export const publish = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.news.publish, {
        id: input.id as Id<"newsPosts">,
      }),
    ),
  );

export const archive = protectedProcedure
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) =>
    fromConvex(() =>
      context.convex.mutation(api.news.archive, {
        id: input.id as Id<"newsPosts">,
      }),
    ),
  );

export const listPublished = publicProcedure
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().min(1).optional(),
    }),
  )
  .handler(async ({ input, context }) =>
    fromConvex(() => context.convex.query(api.news.listPublished, input)),
  );

export const getBySlug = publicProcedure
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input, context }) =>
    fromConvex(() => context.convex.query(api.news.getBySlug, input)),
  );

export const newsRouter = {
  listPublished,
  getBySlug,
  list,
  getById,
  create,
  update,
  remove,
  publish,
  archive,
};
