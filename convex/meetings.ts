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

async function baseSerialize(ctx: QueryCtx, m: Doc<"meetings">) {
  const author = m.authorId ? await ctx.db.get(m.authorId) : null;
  const coverAsset = m.coverAssetId ? await ctx.db.get(m.coverAssetId) : null;
  const hostLab = m.hostLabId ? await ctx.db.get(m.hostLabId) : null;
  return {
    ...m,
    id: m._id,
    startDate: new Date(m.startDate).toISOString(),
    endDate: m.endDate ? new Date(m.endDate).toISOString() : null,
    publishedAt: m.publishedAt ? new Date(m.publishedAt).toISOString() : null,
    author: author
      ? { id: author._id, name: author.name, email: author.email }
      : null,
    coverAsset: await serializeAsset(ctx, coverAsset),
    hostLab: hostLab ? { id: hostLab._id, name: hostLab.name } : null,
  };
}

async function fullSerialize(ctx: QueryCtx, m: Doc<"meetings">) {
  const base = await baseSerialize(ctx, m);
  const topicsPdfAsset = m.topicsPdfAssetId
    ? await ctx.db.get(m.topicsPdfAssetId)
    : null;
  const links = await ctx.db
    .query("meetingAssets")
    .withIndex("by_meeting_sort", (q) => q.eq("meetingId", m._id))
    .collect();
  links.sort((a, b) => a.sortOrder - b.sortOrder);
  const gallery = await Promise.all(
    links.map(async (lk) => {
      const a = await ctx.db.get(lk.assetId);
      return { ...lk, id: lk._id, asset: await serializeAsset(ctx, a) };
    }),
  );
  return {
    ...base,
    topicsPdfAsset: await serializeAsset(ctx, topicsPdfAsset),
    gallery,
  };
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
    await requirePermission(ctx, "MEETINGS", "meetings.read");
    let rows = await ctx.db.query("meetings").collect();
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => b.startDate - a.startDate);
    const page = rows.slice(0, limit);
    return Promise.all(page.map((r) => baseSerialize(ctx, r)));
  },
});

export const getById = query({
  args: { id: v.id("meetings") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "MEETINGS", "meetings.read");
    const m = await ctx.db.get(id);
    if (!m) throw new Error("Meeting not found");
    return await fullSerialize(ctx, m);
  },
});

export const create = mutation({
  args: {
    number: v.number(),
    title: v.string(),
    slug: v.optional(v.union(v.string(), v.null())),
    city: v.string(),
    country: v.string(),
    countryCode: v.string(),
    startDate: v.string(),
    endDate: v.optional(v.union(v.string(), v.null())),
    hostName: v.optional(v.union(v.string(), v.null())),
    hostLabId: v.optional(v.union(v.id("labs"), v.null())),
    summary: v.optional(v.union(v.string(), v.null())),
    content: v.optional(v.union(v.any(), v.null())),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("PUBLISHED"),
      v.literal("ARCHIVED"),
    ),
    coverAssetId: v.optional(v.union(v.id("assets"), v.null())),
    topicsPdfAssetId: v.optional(v.union(v.id("assets"), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requirePermission(ctx, "MEETINGS", "meetings.create");
    const slug = args.slug || generateSlug(args.title);
    const exists = await ctx.db
      .query("meetings")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (exists) throw new Error("Slug already exists");
    const now = Date.now();
    const id = await ctx.db.insert("meetings", {
      number: args.number,
      title: args.title,
      slug,
      city: args.city,
      country: args.country,
      countryCode: args.countryCode,
      startDate: Date.parse(args.startDate),
      endDate: args.endDate ? Date.parse(args.endDate) : undefined,
      hostName: args.hostName ?? undefined,
      hostLabId: args.hostLabId ?? undefined,
      summary: args.summary ?? undefined,
      content: args.content ?? undefined,
      status: args.status,
      coverAssetId: args.coverAssetId ?? undefined,
      topicsPdfAssetId: args.topicsPdfAssetId ?? undefined,
      authorId: userId,
      createdAt: now,
      updatedAt: now,
    });
    const m = await ctx.db.get(id);
    return await baseSerialize(ctx, m!);
  },
});

export const update = mutation({
  args: {
    id: v.id("meetings"),
    data: v.object({
      number: v.optional(v.number()),
      title: v.optional(v.string()),
      slug: v.optional(v.string()),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.union(v.string(), v.null())),
      hostName: v.optional(v.union(v.string(), v.null())),
      hostLabId: v.optional(v.union(v.id("labs"), v.null())),
      summary: v.optional(v.union(v.string(), v.null())),
      content: v.optional(v.union(v.any(), v.null())),
      status: v.optional(
        v.union(
          v.literal("DRAFT"),
          v.literal("PUBLISHED"),
          v.literal("ARCHIVED"),
        ),
      ),
      coverAssetId: v.optional(v.union(v.id("assets"), v.null())),
      topicsPdfAssetId: v.optional(v.union(v.id("assets"), v.null())),
    }),
  },
  handler: async (ctx, { id, data }) => {
    await requirePermission(ctx, "MEETINGS", "meetings.update");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Meeting not found");
    if (data.slug && data.slug !== existing.slug) {
      const dup = await ctx.db
        .query("meetings")
        .withIndex("by_slug", (q) => q.eq("slug", data.slug as string))
        .unique();
      if (dup) throw new Error("Slug already exists");
    }
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (data.number !== undefined) patch.number = data.number;
    if (data.title !== undefined) patch.title = data.title;
    if (data.slug !== undefined) patch.slug = data.slug;
    if (data.city !== undefined) patch.city = data.city;
    if (data.country !== undefined) patch.country = data.country;
    if (data.countryCode !== undefined) patch.countryCode = data.countryCode;
    if (data.startDate !== undefined) patch.startDate = Date.parse(data.startDate);
    if (data.endDate !== undefined)
      patch.endDate = data.endDate ? Date.parse(data.endDate) : undefined;
    if (data.hostName !== undefined) patch.hostName = data.hostName ?? undefined;
    if (data.hostLabId !== undefined) patch.hostLabId = data.hostLabId ?? undefined;
    if (data.summary !== undefined) patch.summary = data.summary ?? undefined;
    if (data.content !== undefined) patch.content = data.content ?? undefined;
    if (data.status !== undefined) patch.status = data.status;
    if (data.coverAssetId !== undefined)
      patch.coverAssetId = data.coverAssetId ?? undefined;
    if (data.topicsPdfAssetId !== undefined)
      patch.topicsPdfAssetId = data.topicsPdfAssetId ?? undefined;
    await ctx.db.patch(id, patch);
    const m = await ctx.db.get(id);
    return await baseSerialize(ctx, m!);
  },
});

export const remove = mutation({
  args: { id: v.id("meetings") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "MEETINGS", "meetings.delete");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Meeting not found");
    // Cascade meetingAssets links
    const links = await ctx.db
      .query("meetingAssets")
      .withIndex("by_meetingId", (q) => q.eq("meetingId", id))
      .collect();
    for (const l of links) await ctx.db.delete(l._id);
    await ctx.db.delete(id);
    return { success: true };
  },
});

export const publish = mutation({
  args: { id: v.id("meetings") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "MEETINGS", "meetings.update");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Reunión no encontrada");
    await ctx.db.patch(id, {
      status: "PUBLISHED",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });
    const m = await ctx.db.get(id);
    return await baseSerialize(ctx, m!);
  },
});

export const archive = mutation({
  args: { id: v.id("meetings") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "MEETINGS", "meetings.update");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Reunión no encontrada");
    await ctx.db.patch(id, { status: "ARCHIVED", updatedAt: Date.now() });
    const m = await ctx.db.get(id);
    return await baseSerialize(ctx, m!);
  },
});

// ── Public ──────────────────────────────────────────────────────────
export const listPublished = query({
  args: {
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db
      .query("meetings")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "PUBLISHED"))
      .collect();
    rows.sort((a, b) => b.number - a.number);
    const page = rows.slice(0, limit);
    return Promise.all(page.map((r) => baseSerialize(ctx, r)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const m = await ctx.db
      .query("meetings")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!m) throw new Error("Meeting not found");
    if (m.status !== "PUBLISHED") throw new Error("Meeting not found");
    return await fullSerialize(ctx, m);
  },
});
