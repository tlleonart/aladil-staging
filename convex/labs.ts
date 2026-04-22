import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { serializeAsset } from "./assets";
import { requirePermission } from "./authHelpers";

async function withLogo(ctx: QueryCtx, lab: Doc<"labs">) {
  const logoAsset = lab.logoAssetId
    ? await ctx.db.get(lab.logoAssetId)
    : null;
  return {
    ...lab,
    id: lab._id,
    logoAsset: await serializeAsset(ctx, logoAsset),
  };
}

async function withLogoAndExecs(ctx: QueryCtx, lab: Doc<"labs">) {
  const base = await withLogo(ctx, lab);
  const execs = await ctx.db
    .query("executiveMembers")
    .withIndex("by_labId", (q) => q.eq("labId", lab._id))
    .filter((q) => q.eq(q.field("isActive"), true))
    .collect();
  execs.sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    ...base,
    executiveMembers: execs.map((e) => ({ ...e, id: e._id })),
  };
}

const EXCLUDED_PUBLIC_LEGACY = "00000000-0000-0000-0000-000000000001";

export const publicList = query({
  args: { limit: v.number() },
  handler: async (ctx, { limit }) => {
    const labs = await ctx.db
      .query("labs")
      .withIndex("by_active_sortOrder", (q) => q.eq("isActive", true))
      .collect();
    const filtered = labs
      .filter((l) => l.legacyId !== EXCLUDED_PUBLIC_LEGACY)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .slice(0, limit);
    return Promise.all(filtered.map((l) => withLogo(ctx, l)));
  },
});

export const list = query({
  args: {
    isActive: v.optional(v.boolean()),
    countryCode: v.optional(v.string()),
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { isActive, countryCode, limit }) => {
    await requirePermission(ctx, "LABS", "labs.read");
    let rows = await ctx.db.query("labs").collect();
    if (isActive !== undefined) {
      rows = rows.filter((l) => l.isActive === isActive);
    }
    if (countryCode) {
      rows = rows.filter((l) => l.countryCode === countryCode);
    }
    rows.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const page = rows.slice(0, limit);
    return Promise.all(page.map((l) => withLogo(ctx, l)));
  },
});

export const getById = query({
  args: { id: v.id("labs") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "LABS", "labs.read");
    const lab = await ctx.db.get(id);
    if (!lab) throw new Error("Lab not found");
    return await withLogoAndExecs(ctx, lab);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    countryCode: v.string(),
    city: v.optional(v.string()),
    websiteUrl: v.optional(v.union(v.string(), v.null())),
    isActive: v.boolean(),
    sortOrder: v.number(),
    logoAssetId: v.optional(v.union(v.id("assets"), v.null())),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "LABS", "labs.create");
    const now = Date.now();
    const id = await ctx.db.insert("labs", {
      name: args.name,
      countryCode: args.countryCode,
      city: args.city ?? undefined,
      websiteUrl: args.websiteUrl ?? undefined,
      isActive: args.isActive,
      sortOrder: args.sortOrder,
      logoAssetId: args.logoAssetId ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
    const lab = await ctx.db.get(id);
    return await withLogo(ctx, lab!);
  },
});

export const update = mutation({
  args: {
    id: v.id("labs"),
    data: v.object({
      name: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      city: v.optional(v.union(v.string(), v.null())),
      websiteUrl: v.optional(v.union(v.string(), v.null())),
      isActive: v.optional(v.boolean()),
      sortOrder: v.optional(v.number()),
      logoAssetId: v.optional(v.union(v.id("assets"), v.null())),
    }),
  },
  handler: async (ctx, { id, data }) => {
    await requirePermission(ctx, "LABS", "labs.update");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lab not found");
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (data.name !== undefined) patch.name = data.name;
    if (data.countryCode !== undefined) patch.countryCode = data.countryCode;
    if (data.city !== undefined) patch.city = data.city ?? undefined;
    if (data.websiteUrl !== undefined)
      patch.websiteUrl = data.websiteUrl || undefined;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder;
    if (data.logoAssetId !== undefined)
      patch.logoAssetId = data.logoAssetId ?? undefined;
    await ctx.db.patch(id, patch);
    const lab = await ctx.db.get(id);
    return await withLogo(ctx, lab!);
  },
});

export const remove = mutation({
  args: { id: v.id("labs") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "LABS", "labs.delete");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lab not found");
    await ctx.db.delete(id);
    return { success: true };
  },
});

export const toggleActive = mutation({
  args: { id: v.id("labs") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "LABS", "labs.update");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Lab not found");
    await ctx.db.patch(id, {
      isActive: !existing.isActive,
      updatedAt: Date.now(),
    });
    const lab = await ctx.db.get(id);
    return await withLogo(ctx, lab!);
  },
});
