import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { serializeAsset } from "./assets";
import { requirePermission } from "./authHelpers";

async function serialize(ctx: QueryCtx, m: Doc<"executiveMembers">) {
  const lab = m.labId ? await ctx.db.get(m.labId) : null;
  const photoAsset = m.photoAssetId ? await ctx.db.get(m.photoAssetId) : null;
  const flagAsset = m.flagAssetId ? await ctx.db.get(m.flagAssetId) : null;
  return {
    ...m,
    id: m._id,
    lab: lab ? { id: lab._id, name: lab.name } : null,
    photoAsset: await serializeAsset(ctx, photoAsset),
    flagAsset: await serializeAsset(ctx, flagAsset),
  };
}

export const list = query({
  args: {
    isActive: v.optional(v.boolean()),
    countryCode: v.optional(v.string()),
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { isActive, countryCode, limit }) => {
    await requirePermission(ctx, "EXEC_COMMITTEE", "executive.read");
    let rows = await ctx.db.query("executiveMembers").collect();
    if (isActive !== undefined) rows = rows.filter((r) => r.isActive === isActive);
    if (countryCode) rows = rows.filter((r) => r.countryCode === countryCode);
    rows.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName),
    );
    const page = rows.slice(0, limit);
    return Promise.all(page.map((r) => serialize(ctx, r)));
  },
});

export const getById = query({
  args: { id: v.id("executiveMembers") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "EXEC_COMMITTEE", "executive.read");
    const m = await ctx.db.get(id);
    if (!m) throw new Error("Executive member not found");
    return await serialize(ctx, m);
  },
});

export const create = mutation({
  args: {
    fullName: v.string(),
    position: v.string(),
    countryCode: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
    labId: v.optional(v.union(v.id("labs"), v.null())),
    photoAssetId: v.optional(v.union(v.id("assets"), v.null())),
    flagAssetId: v.optional(v.union(v.id("assets"), v.null())),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "EXEC_COMMITTEE", "executive.create");
    const now = Date.now();
    const id = await ctx.db.insert("executiveMembers", {
      fullName: args.fullName,
      position: args.position,
      countryCode: args.countryCode,
      sortOrder: args.sortOrder,
      isActive: args.isActive,
      labId: args.labId ?? undefined,
      photoAssetId: args.photoAssetId ?? undefined,
      flagAssetId: args.flagAssetId ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
    const m = await ctx.db.get(id);
    return await serialize(ctx, m!);
  },
});

export const update = mutation({
  args: {
    id: v.id("executiveMembers"),
    data: v.object({
      fullName: v.optional(v.string()),
      position: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      sortOrder: v.optional(v.number()),
      isActive: v.optional(v.boolean()),
      labId: v.optional(v.union(v.id("labs"), v.null())),
      photoAssetId: v.optional(v.union(v.id("assets"), v.null())),
      flagAssetId: v.optional(v.union(v.id("assets"), v.null())),
    }),
  },
  handler: async (ctx, { id, data }) => {
    await requirePermission(ctx, "EXEC_COMMITTEE", "executive.update");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Executive member not found");
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) patch[k] = v === null ? undefined : v;
    }
    await ctx.db.patch(id, patch);
    const m = await ctx.db.get(id);
    return await serialize(ctx, m!);
  },
});

export const remove = mutation({
  args: { id: v.id("executiveMembers") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "EXEC_COMMITTEE", "executive.delete");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Executive member not found");
    await ctx.db.delete(id);
    return { success: true };
  },
});

export const toggleActive = mutation({
  args: { id: v.id("executiveMembers") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "EXEC_COMMITTEE", "executive.update");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Executive member not found");
    await ctx.db.patch(id, {
      isActive: !existing.isActive,
      updatedAt: Date.now(),
    });
    const m = await ctx.db.get(id);
    return await serialize(ctx, m!);
  },
});

export const listPublic = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db
      .query("executiveMembers")
      .withIndex("by_active_sortOrder", (q) => q.eq("isActive", true))
      .collect();
    rows.sort(
      (a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName),
    );
    const page = rows.slice(0, limit);
    return Promise.all(page.map((r) => serialize(ctx, r)));
  },
});
