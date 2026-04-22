import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { serializeAsset } from "./assets";
import { requirePermission } from "./authHelpers";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function baseSerialize(ctx: QueryCtx, p: Doc<"newsPosts">) {
  const author = p.authorId ? await ctx.db.get(p.authorId) : null;
  const coverAsset = p.coverAssetId ? await ctx.db.get(p.coverAssetId) : null;
  return {
    ...p,
    id: p._id,
    publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
    author: author
      ? { id: author._id, name: author.name, email: author.email }
      : null,
    coverAsset: await serializeAsset(ctx, coverAsset),
  };
}

async function fullSerialize(ctx: QueryCtx, p: Doc<"newsPosts">) {
  const base = await baseSerialize(ctx, p);
  const links = await ctx.db
    .query("newsAssets")
    .withIndex("by_news_sort", (q) => q.eq("newsPostId", p._id))
    .collect();
  links.sort((a, b) => a.sortOrder - b.sortOrder);
  const attachments = await Promise.all(
    links.map(async (lk) => {
      const a = await ctx.db.get(lk.assetId);
      return { ...lk, id: lk._id, asset: await serializeAsset(ctx, a) };
    }),
  );
  return { ...base, attachments };
}

export const list = query({
  args: {
    status: v.optional(
      v.union(v.literal("DRAFT"), v.literal("PUBLISHED"), v.literal("ARCHIVED")),
    ),
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { status, limit }) => {
    await requirePermission(ctx, "NEWS", "news.read");
    let rows = await ctx.db.query("newsPosts").collect();
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => b._creationTime - a._creationTime);
    const page = rows.slice(0, limit);
    return Promise.all(page.map((r) => baseSerialize(ctx, r)));
  },
});

export const getById = query({
  args: { id: v.id("newsPosts") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "NEWS", "news.read");
    const p = await ctx.db.get(id);
    if (!p) throw new Error("News post not found");
    return await fullSerialize(ctx, p);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.union(v.string(), v.null())),
    content: v.optional(v.union(v.any(), v.null())),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("PUBLISHED"),
      v.literal("ARCHIVED"),
    ),
    coverAssetId: v.optional(v.union(v.id("assets"), v.null())),
    authorName: v.optional(v.union(v.string(), v.null())),
    publishedAt: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requirePermission(ctx, "NEWS", "news.create");
    const slug = args.slug || generateSlug(args.title);
    const exists = await ctx.db
      .query("newsPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (exists) throw new Error("Slug already exists");
    const now = Date.now();
    const id = await ctx.db.insert("newsPosts", {
      title: args.title,
      slug,
      excerpt: args.excerpt ?? undefined,
      content: args.content ?? undefined,
      status: args.status,
      coverAssetId: args.coverAssetId ?? undefined,
      authorName: args.authorName ?? undefined,
      authorId: userId,
      publishedAt: args.publishedAt ? Date.parse(args.publishedAt) : undefined,
      createdAt: now,
      updatedAt: now,
    });
    const p = await ctx.db.get(id);
    return await baseSerialize(ctx, p!);
  },
});

export const update = mutation({
  args: {
    id: v.id("newsPosts"),
    data: v.object({
      title: v.optional(v.string()),
      slug: v.optional(v.string()),
      excerpt: v.optional(v.union(v.string(), v.null())),
      content: v.optional(v.union(v.any(), v.null())),
      status: v.optional(
        v.union(
          v.literal("DRAFT"),
          v.literal("PUBLISHED"),
          v.literal("ARCHIVED"),
        ),
      ),
      coverAssetId: v.optional(v.union(v.id("assets"), v.null())),
      authorName: v.optional(v.union(v.string(), v.null())),
      publishedAt: v.optional(v.union(v.string(), v.null())),
    }),
  },
  handler: async (ctx, { id, data }) => {
    await requirePermission(ctx, "NEWS", "news.update");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("News post not found");
    if (data.slug && data.slug !== existing.slug) {
      const dup = await ctx.db
        .query("newsPosts")
        .withIndex("by_slug", (q) => q.eq("slug", data.slug as string))
        .unique();
      if (dup) throw new Error("Slug already exists");
    }
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.slug !== undefined) patch.slug = data.slug;
    if (data.excerpt !== undefined) patch.excerpt = data.excerpt ?? undefined;
    if (data.content !== undefined) patch.content = data.content ?? undefined;
    if (data.status !== undefined) patch.status = data.status;
    if (data.coverAssetId !== undefined)
      patch.coverAssetId = data.coverAssetId ?? undefined;
    if (data.authorName !== undefined)
      patch.authorName = data.authorName ?? undefined;
    if (data.publishedAt !== undefined)
      patch.publishedAt = data.publishedAt
        ? Date.parse(data.publishedAt)
        : undefined;
    await ctx.db.patch(id, patch);
    const p = await ctx.db.get(id);
    return await baseSerialize(ctx, p!);
  },
});

export const remove = mutation({
  args: { id: v.id("newsPosts") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "NEWS", "news.delete");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("News post not found");
    const links = await ctx.db
      .query("newsAssets")
      .withIndex("by_newsPostId", (q) => q.eq("newsPostId", id))
      .collect();
    for (const l of links) await ctx.db.delete(l._id);
    await ctx.db.delete(id);
    return { success: true };
  },
});

export const publish = mutation({
  args: { id: v.id("newsPosts") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "NEWS", "news.publish");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Noticia no encontrada");
    await ctx.db.patch(id, {
      status: "PUBLISHED",
      publishedAt: existing.publishedAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    const p = await ctx.db.get(id);
    return await baseSerialize(ctx, p!);
  },
});

export const archive = mutation({
  args: { id: v.id("newsPosts") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "NEWS", "news.publish");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Noticia no encontrada");
    await ctx.db.patch(id, { status: "ARCHIVED", updatedAt: Date.now() });
    const p = await ctx.db.get(id);
    return await baseSerialize(ctx, p!);
  },
});

// ── Public ──────────────────────────────────────────────────────────
export const listPublished = query({
  args: { limit: v.number(), cursor: v.optional(v.string()) },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db
      .query("newsPosts")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "PUBLISHED"))
      .collect();
    rows.sort(
      (a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0),
    );
    const page = rows.slice(0, limit);
    return Promise.all(page.map((r) => baseSerialize(ctx, r)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const p = await ctx.db
      .query("newsPosts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!p || p.status !== "PUBLISHED") {
      throw new Error("News post not found");
    }
    return await fullSerialize(ctx, p);
  },
});
