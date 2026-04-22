import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { auth } from "./auth";

const projectKeyValidator = v.union(
  v.literal("INTRANET"),
  v.literal("NEWS"),
  v.literal("MEETINGS"),
  v.literal("LABS"),
  v.literal("EXEC_COMMITTEE"),
  v.literal("SETTINGS"),
  v.literal("PILA"),
);

export type ProjectKey =
  | "INTRANET"
  | "NEWS"
  | "MEETINGS"
  | "LABS"
  | "EXEC_COMMITTEE"
  | "SETTINGS"
  | "PILA";

/**
 * Internal helper: check whether a user has a specific permission within a project.
 * Super admins bypass all checks.
 */
export async function checkPermission(
  ctx: QueryCtx,
  userId: string,
  projectKey: ProjectKey,
  permissionKey: string,
): Promise<boolean> {
  const user = await ctx.db.get(userId as never);
  if (!user) return false;
  const u = user as unknown as {
    isActive: boolean;
    isSuperAdmin: boolean;
  };
  if (!u.isActive) return false;
  if (u.isSuperAdmin) return true;

  const project = await ctx.db
    .query("projects")
    .withIndex("by_key", (q) => q.eq("key", projectKey))
    .unique();
  if (!project) return false;

  const upr = await ctx.db
    .query("userProjectRoles")
    .withIndex("by_user_project", (q) =>
      q.eq("userId", userId as never).eq("projectId", project._id),
    )
    .unique();
  if (!upr || !upr.isActive) return false;

  const permission = await ctx.db
    .query("permissions")
    .withIndex("by_key", (q) => q.eq("key", permissionKey))
    .unique();
  if (!permission) return false;

  const rolePerm = await ctx.db
    .query("rolePermissions")
    .withIndex("by_role_permission", (q) =>
      q.eq("roleId", upr.roleId).eq("permissionId", permission._id),
    )
    .unique();

  return !!rolePerm;
}

/**
 * Public query: check if the current authenticated user has a permission.
 */
export const hasPermission = query({
  args: {
    projectKey: projectKeyValidator,
    permissionKey: v.string(),
  },
  handler: async (ctx, { projectKey, permissionKey }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return false;
    return checkPermission(ctx, userId, projectKey, permissionKey);
  },
});

/**
 * Public query: list all permission keys the current user has, grouped by project key.
 * Used by the client to render gated UI.
 */
export const currentUserPermissions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return { isSuperAdmin: false, permissions: [] as Array<{ projectKey: string; permissionKey: string }> };

    const user = await ctx.db.get(userId);
    if (!user) return { isSuperAdmin: false, permissions: [] };

    // Super admin: return all permissions for all projects
    if ((user as { isSuperAdmin: boolean }).isSuperAdmin) {
      const projects = await ctx.db.query("projects").collect();
      const allPerms = await ctx.db.query("permissions").collect();
      const out: Array<{ projectKey: string; permissionKey: string }> = [];
      for (const p of projects) {
        for (const perm of allPerms) {
          out.push({ projectKey: p.key, permissionKey: perm.key });
        }
      }
      return { isSuperAdmin: true, permissions: out };
    }

    const memberships = await ctx.db
      .query("userProjectRoles")
      .withIndex("by_user_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .collect();

    const out: Array<{ projectKey: string; permissionKey: string }> = [];
    for (const m of memberships) {
      const project = await ctx.db.get(m.projectId);
      if (!project || !project.isActive) continue;
      const rolePerms = await ctx.db
        .query("rolePermissions")
        .withIndex("by_roleId", (q) => q.eq("roleId", m.roleId))
        .collect();
      for (const rp of rolePerms) {
        const perm = await ctx.db.get(rp.permissionId);
        if (!perm) continue;
        out.push({ projectKey: project.key, permissionKey: perm.key });
      }
    }
    return { isSuperAdmin: false, permissions: out };
  },
});
