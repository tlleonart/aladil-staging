import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./authHelpers";

/**
 * Generate a short-lived signed URL so the client can POST a file directly to Convex Storage.
 * Requires an authenticated user.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Same, but protected with MIGRATION_SECRET — used by data-migration scripts that run without a session.
 */
export const generateMigrationUploadUrl = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    const expected = process.env.MIGRATION_SECRET;
    if (!expected || secret !== expected) {
      throw new Error("unauthorized");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/** Public helper: get a URL for a storage id (nullable). */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});
