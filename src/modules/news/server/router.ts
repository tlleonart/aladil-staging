import * as z from "zod";
import { hasPermission } from "@/modules/core/auth/rbac";
import { prisma } from "@/modules/core/db";
import {
  ORPCError,
  protectedProcedure,
  publicProcedure,
} from "@/modules/core/orpc/server";
import {
  CreateNewsPostSchema,
  ListNewsQuerySchema,
  UpdateNewsPostSchema,
} from "../schemas";

// Helper to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Permission check middleware
const withPermission = (permission: string) =>
  protectedProcedure.use(async ({ context, next }) => {
    const allowed = await hasPermission(context.user.id, "NEWS", permission);
    if (!allowed) {
      throw new ORPCError("FORBIDDEN", {
        message: `Permission denied: ${permission}`,
      });
    }
    return next({ context });
  });

// List news posts
export const list = withPermission("news.read")
  .input(ListNewsQuerySchema)
  .handler(async ({ input }) => {
    const { status, limit, cursor } = input;

    const posts = await prisma.newsPost.findMany({
      where: {
        ...(status && { status }),
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        author: { select: { id: true, name: true, email: true } },
        coverAsset: true,
      },
    });

    return posts;
  });

// Get single news post by ID
export const getById = withPermission("news.read")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const post = await prisma.newsPost.findUnique({
      where: { id: input.id },
      include: {
        author: { select: { id: true, name: true, email: true } },
        coverAsset: true,
        attachments: { include: { asset: true } },
      },
    });

    if (!post) {
      throw new ORPCError("NOT_FOUND", { message: "News post not found" });
    }

    return post;
  });

// Create news post
export const create = withPermission("news.create")
  .input(CreateNewsPostSchema)
  .handler(async ({ input, context }) => {
    const slug = input.slug || generateSlug(input.title);

    // Check if slug already exists
    const existing = await prisma.newsPost.findUnique({ where: { slug } });
    if (existing) {
      throw new ORPCError("BAD_REQUEST", { message: "Slug already exists" });
    }

    const post = await prisma.newsPost.create({
      data: {
        title: input.title,
        slug,
        excerpt: input.excerpt,
        content: input.content,
        status: input.status,
        coverAssetId: input.coverAssetId,
        authorId: context.user.id,
      },
    });

    return post;
  });

// Update news post
export const update = withPermission("news.update")
  .input(
    z.object({
      id: z.string().uuid(),
      data: UpdateNewsPostSchema,
    }),
  )
  .handler(async ({ input }) => {
    const existing = await prisma.newsPost.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "News post not found" });
    }

    // If slug is being changed, check for uniqueness
    if (input.data.slug && input.data.slug !== existing.slug) {
      const slugExists = await prisma.newsPost.findUnique({
        where: { slug: input.data.slug },
      });
      if (slugExists) {
        throw new ORPCError("BAD_REQUEST", { message: "Slug already exists" });
      }
    }

    const post = await prisma.newsPost.update({
      where: { id: input.id },
      data: input.data,
    });

    return post;
  });

// Delete news post
export const remove = withPermission("news.delete")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const existing = await prisma.newsPost.findUnique({
      where: { id: input.id },
    });
    if (!existing) {
      throw new ORPCError("NOT_FOUND", { message: "News post not found" });
    }

    await prisma.newsPost.delete({ where: { id: input.id } });
    return { success: true };
  });

// Publish news post
export const publish = withPermission("news.publish")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const post = await prisma.newsPost.update({
      where: { id: input.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return post;
  });

// Unpublish (archive) news post
export const archive = withPermission("news.publish")
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    const post = await prisma.newsPost.update({
      where: { id: input.id },
      data: { status: "ARCHIVED" },
    });

    return post;
  });

// ==========================================
// PUBLIC PROCEDURES (no auth required)
// ==========================================

// List published news posts (public)
export const listPublished = publicProcedure
  .input(
    z.object({
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().uuid().optional(),
    }),
  )
  .handler(async ({ input }) => {
    const { limit, cursor } = input;

    const posts = await prisma.newsPost.findMany({
      where: {
        status: "PUBLISHED",
        ...(cursor && { id: { lt: cursor } }),
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: {
        author: { select: { id: true, name: true } },
        coverAsset: true,
      },
    });

    return posts;
  });

// Get single published news post by slug (public)
export const getBySlug = publicProcedure
  .input(z.object({ slug: z.string() }))
  .handler(async ({ input }) => {
    const post = await prisma.newsPost.findFirst({
      where: {
        slug: input.slug,
        status: "PUBLISHED",
      },
      include: {
        author: { select: { id: true, name: true } },
        coverAsset: true,
        attachments: { include: { asset: true } },
      },
    });

    if (!post) {
      throw new ORPCError("NOT_FOUND", { message: "News post not found" });
    }

    return post;
  });

export const newsRouter = {
  // Public procedures
  listPublished,
  getBySlug,
  // Protected procedures
  list,
  getById,
  create,
  update,
  remove,
  publish,
  archive,
};
