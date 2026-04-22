import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { auth } from "./auth";
import { requireAuth, requireSuperAdmin } from "./authHelpers";
import bcrypt from "bcryptjs";

async function fullSerialize(ctx: QueryCtx, u: Doc<"users">) {
  const lab = u.labId ? await ctx.db.get(u.labId) : null;
  const memberships = await ctx.db
    .query("userProjectRoles")
    .withIndex("by_userId", (q) => q.eq("userId", u._id))
    .collect();
  const membershipsSerialized = await Promise.all(
    memberships.map(async (m) => {
      const project = await ctx.db.get(m.projectId);
      const role = await ctx.db.get(m.roleId);
      return {
        id: m._id,
        isActive: m.isActive,
        project: project
          ? { id: project._id, key: project.key, name: project.name }
          : null,
        role: role
          ? { id: role._id, key: role.key, name: role.name }
          : null,
      };
    }),
  );
  return {
    id: u._id,
    email: u.email,
    name: u.name,
    isActive: u.isActive,
    isSuperAdmin: u.isSuperAdmin,
    labId: u.labId ?? null,
    lab: lab ? { id: lab._id, name: lab.name } : null,
    createdAt: new Date(u._creationTime).toISOString(),
    updatedAt: new Date(u._creationTime).toISOString(),
    memberships: membershipsSerialized,
  };
}

async function syncProjectRole(
  ctx: MutationCtx,
  userId: Id<"users">,
  projectKey: "PILA" | "INTRANET",
  roleKey: string | undefined,
) {
  if (roleKey === undefined) return;
  const project = await ctx.db
    .query("projects")
    .withIndex("by_key", (q) => q.eq("key", projectKey))
    .unique();
  if (!project) return;
  const existing = await ctx.db
    .query("userProjectRoles")
    .withIndex("by_user_project", (q) =>
      q.eq("userId", userId).eq("projectId", project._id),
    )
    .unique();
  if (roleKey === "none") {
    if (existing) await ctx.db.delete(existing._id);
    return;
  }
  const role = await ctx.db
    .query("roles")
    .withIndex("by_project_key", (q) =>
      q.eq("projectId", project._id).eq("key", roleKey),
    )
    .unique();
  if (!role) return;
  if (existing) {
    await ctx.db.patch(existing._id, {
      roleId: role._id,
      isActive: true,
      updatedAt: Date.now(),
    });
  } else {
    await ctx.db.insert("userProjectRoles", {
      userId,
      projectId: project._id,
      roleId: role._id,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
}

export const list = query({
  args: {
    isActive: v.optional(v.boolean()),
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { isActive, limit }) => {
    await requireSuperAdmin(ctx);
    let rows = await ctx.db.query("users").collect();
    if (isActive !== undefined) rows = rows.filter((r) => r.isActive === isActive);
    rows.sort((a, b) => b._creationTime - a._creationTime);
    const page = rows.slice(0, limit);
    return Promise.all(page.map((r) => fullSerialize(ctx, r)));
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    await requireSuperAdmin(ctx);
    const u = await ctx.db.get(id);
    if (!u) throw new Error("User not found");
    return await fullSerialize(ctx, u);
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    password: v.string(),
    isActive: v.boolean(),
    isSuperAdmin: v.boolean(),
    labId: v.optional(v.union(v.id("labs"), v.null())),
    roleKey: v.optional(v.string()),
    pilaRoleKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) throw new Error("Email already exists");
    const hash = await bcrypt.hash(args.password, 12);
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      emailVerificationTime: Date.now(),
      isActive: args.isActive,
      isSuperAdmin: args.isSuperAdmin,
      labId: args.labId ?? undefined,
    });
    await ctx.db.insert("authAccounts", {
      userId,
      provider: "password",
      providerAccountId: args.email,
      secret: hash,
    });
    await syncProjectRole(ctx, userId, "INTRANET", args.roleKey);
    await syncProjectRole(ctx, userId, "PILA", args.pilaRoleKey);
    const u = await ctx.db.get(userId);
    return await fullSerialize(ctx, u!);
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    data: v.object({
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      password: v.optional(v.string()),
      isActive: v.optional(v.boolean()),
      isSuperAdmin: v.optional(v.boolean()),
      labId: v.optional(v.union(v.id("labs"), v.null())),
      roleKey: v.optional(v.string()),
      pilaRoleKey: v.optional(v.string()),
    }),
  },
  handler: async (ctx, { id, data }) => {
    await requireSuperAdmin(ctx);
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("User not found");
    if (data.email && data.email !== existing.email) {
      const dup = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", data.email as string))
        .unique();
      if (dup) throw new Error("Email already exists");
    }
    const patch: Record<string, unknown> = {};
    if (data.email !== undefined) patch.email = data.email;
    if (data.name !== undefined) patch.name = data.name;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.isSuperAdmin !== undefined) patch.isSuperAdmin = data.isSuperAdmin;
    if (data.labId !== undefined) patch.labId = data.labId ?? undefined;
    await ctx.db.patch(id, patch);
    if (data.password) {
      const hash = await bcrypt.hash(data.password, 12);
      const acc = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) =>
          q.eq("userId", id).eq("provider", "password"),
        )
        .unique();
      if (acc) {
        await ctx.db.patch(acc._id, { secret: hash });
      } else {
        await ctx.db.insert("authAccounts", {
          userId: id,
          provider: "password",
          providerAccountId: existing.email ?? "",
          secret: hash,
        });
      }
    }
    await syncProjectRole(ctx, id, "INTRANET", data.roleKey);
    await syncProjectRole(ctx, id, "PILA", data.pilaRoleKey);
    const u = await ctx.db.get(id);
    return await fullSerialize(ctx, u!);
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const me = await requireSuperAdmin(ctx);
    if (id === me) throw new Error("Cannot delete your own account");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("User not found");
    // Cascade: memberships, accounts
    const mems = await ctx.db
      .query("userProjectRoles")
      .withIndex("by_userId", (q) => q.eq("userId", id))
      .collect();
    for (const m of mems) await ctx.db.delete(m._id);
    const accs = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", id))
      .collect();
    for (const a of accs) await ctx.db.delete(a._id);
    const sesss = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", id))
      .collect();
    for (const s of sesss) await ctx.db.delete(s._id);
    await ctx.db.delete(id);
    return { success: true };
  },
});

export const toggleActive = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    const me = await requireSuperAdmin(ctx);
    if (id === me) throw new Error("Cannot deactivate your own account");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("User not found");
    await ctx.db.patch(id, { isActive: !existing.isActive });
    const u = await ctx.db.get(id);
    return {
      id: u!._id,
      email: u!.email,
      name: u!.name,
      isActive: u!.isActive,
      isSuperAdmin: u!.isSuperAdmin,
      createdAt: new Date(u!._creationTime).toISOString(),
      updatedAt: new Date(u!._creationTime).toISOString(),
    };
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    const u = await ctx.db.get(userId);
    if (!u) return null;

    const lab = u.labId ? await ctx.db.get(u.labId) : null;
    const memberships = await ctx.db
      .query("userProjectRoles")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", userId).eq("isActive", true),
      )
      .collect();

    let allPermissions: string[] = u.isSuperAdmin ? ["*"] : [];
    let effectiveRole: "admin" | "director" | "reporter" = "reporter";
    if (u.isSuperAdmin) effectiveRole = "admin";

    const flatMems: Array<{
      projectKey: string;
      roleKey: string;
      permissions: string[];
    }> = [];

    for (const m of memberships) {
      const project = await ctx.db.get(m.projectId);
      const role = await ctx.db.get(m.roleId);
      if (!project || !role) continue;
      const rolePerms = await ctx.db
        .query("rolePermissions")
        .withIndex("by_roleId", (q) => q.eq("roleId", role._id))
        .collect();
      const permissionKeys: string[] = [];
      for (const rp of rolePerms) {
        const p = await ctx.db.get(rp.permissionId);
        if (p) permissionKeys.push(p.key);
      }
      flatMems.push({
        projectKey: project.key,
        roleKey: role.key,
        permissions: permissionKeys,
      });
      if (project.key === "INTRANET" && !u.isSuperAdmin) {
        if (role.key === "admin") effectiveRole = "admin";
        else if (role.key === "director") effectiveRole = "director";
      }
    }

    if (!u.isSuperAdmin) {
      allPermissions = flatMems.flatMap((m) => m.permissions);
    }

    return {
      id: u._id,
      email: u.email ?? "",
      name: u.name ?? "",
      isSuperAdmin: u.isSuperAdmin,
      labId: u.labId ?? null,
      labName: lab?.name ?? null,
      effectiveRole,
      permissions: allPermissions,
    };
  },
});

export const updateProfile = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await requireAuth(ctx);
    await ctx.db.patch(userId, { name });
    return { success: true };
  },
});

export const changePassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { currentPassword, newPassword }) => {
    const userId = await requireAuth(ctx);
    const acc = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "password"),
      )
      .unique();
    if (!acc?.secret) {
      throw new Error("No se encontró una cuenta con contraseña");
    }
    const ok = await bcrypt.compare(currentPassword, acc.secret);
    if (!ok) throw new Error("La contraseña actual es incorrecta");
    const hashed = await bcrypt.hash(newPassword, 12);
    await ctx.db.patch(acc._id, { secret: hashed });
    return { success: true };
  },
});
