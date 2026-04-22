import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query, type QueryCtx } from "./_generated/server";
import {
  requireAuth,
  requirePermission,
  resolveAssetUrl,
} from "./authHelpers";

export type AssetWithUrl = Doc<"assets"> & {
  id: string;
  bucket: string;
  path: string;
  url: string | null;
};

export async function serializeAsset(
  ctx: QueryCtx,
  asset: Doc<"assets"> | null,
): Promise<AssetWithUrl | null> {
  if (!asset) return null;
  const url = await resolveAssetUrl(ctx, asset);
  return {
    ...asset,
    id: asset._id,
    bucket: asset.legacyBucket ?? "assets",
    path: asset.legacyPath ?? "",
    url,
  };
}

export const create = mutation({
  args: {
    type: v.union(
      v.literal("IMAGE"),
      v.literal("PDF"),
      v.literal("OTHER"),
    ),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.optional(v.string()),
    size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const id = await ctx.db.insert("assets", {
      type: args.type,
      filename: args.filename,
      mimeType: args.mimeType ?? undefined,
      sizeBytes: args.size ?? undefined,
      storageId: args.storageId,
      uploadedById: userId,
      createdAt: Date.now(),
    });
    const asset = await ctx.db.get(id);
    return await serializeAsset(ctx, asset);
  },
});

export const getById = query({
  args: { id: v.id("assets") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    const a = await ctx.db.get(id);
    if (!a) throw new Error("Asset no encontrado");
    return await serializeAsset(ctx, a);
  },
});

export const remove = mutation({
  args: { id: v.id("assets") },
  handler: async (ctx, { id }) => {
    await requireAuth(ctx);
    const a = await ctx.db.get(id);
    if (!a) throw new Error("Asset no encontrado");
    await ctx.db.delete(id);
    if (a.storageId) {
      await ctx.storage.delete(a.storageId);
    }
    return {
      success: true,
      path: a.legacyPath ?? "",
      bucket: a.legacyBucket ?? "assets",
    };
  },
});

export const list = query({
  args: {
    type: v.optional(
      v.union(v.literal("IMAGE"), v.literal("PDF"), v.literal("OTHER")),
    ),
    limit: v.number(),
  },
  handler: async (ctx, { type, limit }) => {
    await requireAuth(ctx);
    const rows = type
      ? await ctx.db
          .query("assets")
          .withIndex("by_type", (q) => q.eq("type", type))
          .order("desc")
          .take(limit)
      : await ctx.db.query("assets").order("desc").take(limit);
    return Promise.all(rows.map((r) => serializeAsset(ctx, r)));
  },
});

/** Resolve a URL for an asset by id (used by server components). */
export const getUrlById = query({
  args: { id: v.id("assets") },
  handler: async (ctx, { id }) => {
    const a = await ctx.db.get(id);
    if (!a) return null;
    return await resolveAssetUrl(ctx, a);
  },
});
