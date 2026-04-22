import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requirePermission } from "./authHelpers";

export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, { status, limit }) => {
    await requirePermission(ctx, "SETTINGS", "contact.read");
    const q = status
      ? ctx.db
          .query("contactMessages")
          .withIndex("by_status", (q) => q.eq("status", status))
      : ctx.db.query("contactMessages").withIndex("by_createdAt");
    return (await q.order("desc").take(limit)).map((m) => ({
      ...m,
      id: m._id,
    }));
  },
});

export const getById = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "SETTINGS", "contact.read");
    const m = await ctx.db.get(id);
    if (!m) throw new Error("Contact message not found");
    if (m.status === "NEW") {
      await ctx.db.patch(m._id, { status: "READ" });
      return { ...m, status: "READ", id: m._id };
    }
    return { ...m, id: m._id };
  },
});

export const markAsRead = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "SETTINGS", "contact.read");
    const m = await ctx.db.get(id);
    if (!m) throw new Error("Contact message not found");
    await ctx.db.patch(id, { status: "READ" });
    return { ...(await ctx.db.get(id))!, id };
  },
});

export const archive = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "SETTINGS", "contact.archive");
    const m = await ctx.db.get(id);
    if (!m) throw new Error("Contact message not found");
    await ctx.db.patch(id, { status: "ARCHIVED" });
    return { ...(await ctx.db.get(id))!, id };
  },
});

export const unarchive = mutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, { id }) => {
    await requirePermission(ctx, "SETTINGS", "contact.archive");
    const m = await ctx.db.get(id);
    if (!m) throw new Error("Contact message not found");
    await ctx.db.patch(id, { status: "READ" });
    return { ...(await ctx.db.get(id))!, id };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { name, email, message }) => {
    const id = await ctx.db.insert("contactMessages", {
      name,
      email,
      message,
      status: "NEW",
      createdAt: Date.now(),
    });
    return { success: true, id };
  },
});
