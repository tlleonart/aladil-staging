/**
 * Migration mutations — import data from Prisma JSON dumps into Convex.
 * Each mutation is guarded by MIGRATION_SECRET (env var set via `npx convex env set`).
 * FKs are resolved through the `by_legacyId` index on each table.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

// ─── Secret guard ────────────────────────────────────────────────────
function assertSecret(secret: string) {
  const expected = process.env.MIGRATION_SECRET;
  if (!expected || secret !== expected) {
    throw new Error("unauthorized: bad MIGRATION_SECRET");
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────
function toEpoch(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const t = Date.parse(value);
  return Number.isNaN(t) ? undefined : t;
}

function toEpochRequired(value: string): number {
  const t = Date.parse(value);
  if (Number.isNaN(t)) throw new Error(`invalid date: ${value}`);
  return t;
}

// ─── Reset (nuke) ────────────────────────────────────────────────────
/** Danger: wipes every table. Use only in dev. */
export const reset = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    assertSecret(secret);
    const tables = [
      "auditEvents",
      "pilaPublishedReports",
      "pilaReportValues",
      "pilaReports",
      "pilaIndicators",
      "contactMessages",
      "newsAssets",
      "newsPosts",
      "meetingAssets",
      "meetings",
      "executiveMembers",
      "labs",
      "userProjectRoles",
      "rolePermissions",
      "roles",
      "permissions",
      "projects",
      "assets",
      "authSessions",
      "authAccounts",
      "authRefreshTokens",
      "authVerifiers",
      "authVerificationCodes",
      "authRateLimits",
      "users",
    ] as const;
    let total = 0;
    for (const t of tables) {
      const rows = await ctx.db.query(t as never).collect();
      for (const r of rows) {
        await ctx.db.delete((r as { _id: Id<"users"> })._id);
        total++;
      }
    }
    return { deleted: total };
  },
});

// ─── USERS + auth accounts (password) ────────────────────────────────
export const importUsers = mutation({
  args: {
    secret: v.string(),
    users: v.array(
      v.object({
        legacyId: v.string(),
        email: v.string(),
        name: v.string(),
        emailVerified: v.boolean(),
        image: v.optional(v.union(v.string(), v.null())),
        isActive: v.boolean(),
        isSuperAdmin: v.boolean(),
        labLegacyId: v.optional(v.union(v.string(), v.null())),
        passwordHash: v.optional(v.union(v.string(), v.null())),
      }),
    ),
  },
  handler: async (ctx, { secret, users }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    let authLinked = 0;
    for (const u of users) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", u.legacyId))
        .unique();

      const fields = {
        email: u.email,
        name: u.name,
        emailVerificationTime: u.emailVerified ? Date.now() : undefined,
        image: u.image ?? undefined,
        isActive: u.isActive,
        isSuperAdmin: u.isSuperAdmin,
        legacyId: u.legacyId,
      };

      let userId: Id<"users">;
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        userId = existing._id;
        updated++;
      } else {
        userId = await ctx.db.insert("users", fields);
        inserted++;
      }

      // Seed auth account for password login
      if (u.passwordHash) {
        const existingAcc = await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) =>
            q.eq("userId", userId).eq("provider", "password"),
          )
          .unique();
        if (!existingAcc) {
          await ctx.db.insert("authAccounts", {
            userId,
            provider: "password",
            providerAccountId: u.email,
            secret: u.passwordHash,
          });
          authLinked++;
        } else if (existingAcc.secret !== u.passwordHash) {
          await ctx.db.patch(existingAcc._id, { secret: u.passwordHash });
          authLinked++;
        }
      }
    }
    return { inserted, updated, authLinked };
  },
});

/** Second pass: set users.labId after labs are imported. */
export const linkUsersToLabs = mutation({
  args: {
    secret: v.string(),
    links: v.array(
      v.object({
        userLegacyId: v.string(),
        labLegacyId: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, links }) => {
    assertSecret(secret);
    let linked = 0;
    for (const l of links) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", l.userLegacyId))
        .unique();
      const lab = await ctx.db
        .query("labs")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", l.labLegacyId))
        .unique();
      if (user && lab) {
        await ctx.db.patch(user._id, { labId: lab._id });
        linked++;
      }
    }
    return { linked };
  },
});

// ─── PROJECTS ────────────────────────────────────────────────────────
export const importProjects = mutation({
  args: {
    secret: v.string(),
    projects: v.array(
      v.object({
        legacyId: v.string(),
        key: v.union(
          v.literal("INTRANET"),
          v.literal("NEWS"),
          v.literal("MEETINGS"),
          v.literal("LABS"),
          v.literal("EXEC_COMMITTEE"),
          v.literal("SETTINGS"),
          v.literal("PILA"),
        ),
        name: v.string(),
        description: v.optional(v.union(v.string(), v.null())),
        isActive: v.boolean(),
        createdAt: v.string(),
        updatedAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, projects }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const p of projects) {
      const fields = {
        key: p.key,
        name: p.name,
        description: p.description ?? undefined,
        isActive: p.isActive,
        createdAt: toEpochRequired(p.createdAt),
        updatedAt: toEpochRequired(p.updatedAt),
        legacyId: p.legacyId,
      };
      const existing = await ctx.db
        .query("projects")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", p.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("projects", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── PERMISSIONS ─────────────────────────────────────────────────────
export const importPermissions = mutation({
  args: {
    secret: v.string(),
    permissions: v.array(
      v.object({
        legacyId: v.string(),
        key: v.string(),
        description: v.optional(v.union(v.string(), v.null())),
      }),
    ),
  },
  handler: async (ctx, { secret, permissions }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const p of permissions) {
      const fields = {
        key: p.key,
        description: p.description ?? undefined,
        legacyId: p.legacyId,
      };
      const existing = await ctx.db
        .query("permissions")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", p.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("permissions", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── ROLES ───────────────────────────────────────────────────────────
export const importRoles = mutation({
  args: {
    secret: v.string(),
    roles: v.array(
      v.object({
        legacyId: v.string(),
        projectLegacyId: v.string(),
        key: v.string(),
        name: v.string(),
        description: v.optional(v.union(v.string(), v.null())),
        isSystem: v.boolean(),
        createdAt: v.string(),
        updatedAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, roles }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of roles) {
      const project = await ctx.db
        .query("projects")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.projectLegacyId))
        .unique();
      if (!project) {
        throw new Error(
          `role ${r.legacyId}: project ${r.projectLegacyId} not found`,
        );
      }
      const fields = {
        projectId: project._id,
        key: r.key,
        name: r.name,
        description: r.description ?? undefined,
        isSystem: r.isSystem,
        createdAt: toEpochRequired(r.createdAt),
        updatedAt: toEpochRequired(r.updatedAt),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("roles")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("roles", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── ROLE-PERMISSIONS ────────────────────────────────────────────────
export const importRolePermissions = mutation({
  args: {
    secret: v.string(),
    rolePermissions: v.array(
      v.object({
        legacyId: v.string(),
        roleLegacyId: v.string(),
        permissionLegacyId: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, rolePermissions }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const rp of rolePermissions) {
      const role = await ctx.db
        .query("roles")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", rp.roleLegacyId))
        .unique();
      const perm = await ctx.db
        .query("permissions")
        .withIndex("by_legacyId", (q) =>
          q.eq("legacyId", rp.permissionLegacyId),
        )
        .unique();
      if (!role || !perm) {
        throw new Error(
          `rolePermission ${rp.legacyId}: role or permission missing`,
        );
      }
      const fields = {
        roleId: role._id,
        permissionId: perm._id,
        legacyId: rp.legacyId,
      };
      const existing = await ctx.db
        .query("rolePermissions")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", rp.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("rolePermissions", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── USER-PROJECT-ROLES ──────────────────────────────────────────────
export const importUserProjectRoles = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        userLegacyId: v.string(),
        projectLegacyId: v.string(),
        roleLegacyId: v.string(),
        isActive: v.boolean(),
        createdAt: v.string(),
        updatedAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const row of rows) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", row.userLegacyId))
        .unique();
      const project = await ctx.db
        .query("projects")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", row.projectLegacyId))
        .unique();
      const role = await ctx.db
        .query("roles")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", row.roleLegacyId))
        .unique();
      if (!user || !project || !role) {
        throw new Error(`userProjectRole ${row.legacyId}: missing FK`);
      }
      const fields = {
        userId: user._id,
        projectId: project._id,
        roleId: role._id,
        isActive: row.isActive,
        createdAt: toEpochRequired(row.createdAt),
        updatedAt: toEpochRequired(row.updatedAt),
        legacyId: row.legacyId,
      };
      const existing = await ctx.db
        .query("userProjectRoles")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", row.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("userProjectRoles", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── LABS (first pass: without logoAssetId) ──────────────────────────
export const importLabs = mutation({
  args: {
    secret: v.string(),
    labs: v.array(
      v.object({
        legacyId: v.string(),
        name: v.string(),
        countryCode: v.string(),
        city: v.optional(v.union(v.string(), v.null())),
        websiteUrl: v.optional(v.union(v.string(), v.null())),
        isActive: v.boolean(),
        sortOrder: v.number(),
        createdAt: v.string(),
        updatedAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, labs }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const l of labs) {
      const fields = {
        name: l.name,
        countryCode: l.countryCode,
        city: l.city ?? undefined,
        websiteUrl: l.websiteUrl ?? undefined,
        isActive: l.isActive,
        sortOrder: l.sortOrder,
        createdAt: toEpochRequired(l.createdAt),
        updatedAt: toEpochRequired(l.updatedAt),
        legacyId: l.legacyId,
      };
      const existing = await ctx.db
        .query("labs")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", l.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("labs", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

/** Second pass: link Lab.logoAssetId after assets imported. */
export const linkLabLogos = mutation({
  args: {
    secret: v.string(),
    links: v.array(
      v.object({
        labLegacyId: v.string(),
        assetLegacyId: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, links }) => {
    assertSecret(secret);
    let linked = 0;
    for (const l of links) {
      const lab = await ctx.db
        .query("labs")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", l.labLegacyId))
        .unique();
      const asset = await ctx.db
        .query("assets")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", l.assetLegacyId))
        .unique();
      if (lab && asset) {
        await ctx.db.patch(lab._id, { logoAssetId: asset._id });
        linked++;
      }
    }
    return { linked };
  },
});

// ─── ASSETS ──────────────────────────────────────────────────────────
/**
 * Import one asset record. Caller must have already uploaded the file bytes
 * to Convex Storage and passes the resulting storageId here.
 */
export const importAssets = mutation({
  args: {
    secret: v.string(),
    assets: v.array(
      v.object({
        legacyId: v.string(),
        type: v.union(
          v.literal("IMAGE"),
          v.literal("PDF"),
          v.literal("OTHER"),
        ),
        filename: v.string(),
        mimeType: v.optional(v.union(v.string(), v.null())),
        sizeBytes: v.optional(v.union(v.number(), v.null())),
        width: v.optional(v.union(v.number(), v.null())),
        height: v.optional(v.union(v.number(), v.null())),
        uploadedByLegacyId: v.optional(v.union(v.string(), v.null())),
        createdAt: v.string(),
        storageId: v.optional(v.union(v.id("_storage"), v.null())),
        legacyBucket: v.string(),
        legacyPath: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, assets }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const a of assets) {
      let uploadedById: Id<"users"> | undefined = undefined;
      if (a.uploadedByLegacyId) {
        const u = await ctx.db
          .query("users")
          .withIndex("by_legacyId", (q) =>
            q.eq("legacyId", a.uploadedByLegacyId as string),
          )
          .unique();
        uploadedById = u?._id;
      }
      const fields = {
        type: a.type,
        filename: a.filename,
        mimeType: a.mimeType ?? undefined,
        sizeBytes: a.sizeBytes ?? undefined,
        width: a.width ?? undefined,
        height: a.height ?? undefined,
        uploadedById,
        createdAt: toEpochRequired(a.createdAt),
        storageId: a.storageId ?? undefined,
        legacyBucket: a.legacyBucket,
        legacyPath: a.legacyPath,
        legacyId: a.legacyId,
      };
      const existing = await ctx.db
        .query("assets")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", a.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("assets", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── EXECUTIVE MEMBERS ───────────────────────────────────────────────
export const importExecutiveMembers = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        fullName: v.string(),
        position: v.string(),
        countryCode: v.string(),
        sortOrder: v.number(),
        isActive: v.boolean(),
        labLegacyId: v.optional(v.union(v.string(), v.null())),
        photoAssetLegacyId: v.optional(v.union(v.string(), v.null())),
        flagAssetLegacyId: v.optional(v.union(v.string(), v.null())),
        createdAt: v.string(),
        updatedAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const labId = r.labLegacyId
        ? (
            await ctx.db
              .query("labs")
              .withIndex("by_legacyId", (q) =>
                q.eq("legacyId", r.labLegacyId as string),
              )
              .unique()
          )?._id
        : undefined;
      const photoAssetId = r.photoAssetLegacyId
        ? (
            await ctx.db
              .query("assets")
              .withIndex("by_legacyId", (q) =>
                q.eq("legacyId", r.photoAssetLegacyId as string),
              )
              .unique()
          )?._id
        : undefined;
      const flagAssetId = r.flagAssetLegacyId
        ? (
            await ctx.db
              .query("assets")
              .withIndex("by_legacyId", (q) =>
                q.eq("legacyId", r.flagAssetLegacyId as string),
              )
              .unique()
          )?._id
        : undefined;
      const fields = {
        fullName: r.fullName,
        position: r.position,
        countryCode: r.countryCode,
        sortOrder: r.sortOrder,
        isActive: r.isActive,
        labId,
        photoAssetId,
        flagAssetId,
        createdAt: toEpochRequired(r.createdAt),
        updatedAt: toEpochRequired(r.updatedAt),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("executiveMembers")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("executiveMembers", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── MEETINGS ────────────────────────────────────────────────────────
export const importMeetings = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        number: v.number(),
        title: v.string(),
        slug: v.string(),
        city: v.string(),
        country: v.string(),
        countryCode: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.union(v.string(), v.null())),
        hostName: v.optional(v.union(v.string(), v.null())),
        hostLabLegacyId: v.optional(v.union(v.string(), v.null())),
        summary: v.optional(v.union(v.string(), v.null())),
        content: v.optional(v.union(v.any(), v.null())),
        status: v.union(
          v.literal("DRAFT"),
          v.literal("PUBLISHED"),
          v.literal("ARCHIVED"),
        ),
        coverAssetLegacyId: v.optional(v.union(v.string(), v.null())),
        topicsPdfAssetLegacyId: v.optional(v.union(v.string(), v.null())),
        authorLegacyId: v.optional(v.union(v.string(), v.null())),
        createdAt: v.string(),
        updatedAt: v.string(),
        publishedAt: v.optional(v.union(v.string(), v.null())),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    const resolveLab = async (id?: string | null) => {
      if (!id) return undefined;
      const l = await ctx.db
        .query("labs")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", id))
        .unique();
      return l?._id;
    };
    const resolveAsset = async (id?: string | null) => {
      if (!id) return undefined;
      const a = await ctx.db
        .query("assets")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", id))
        .unique();
      return a?._id;
    };
    const resolveUser = async (id?: string | null) => {
      if (!id) return undefined;
      const u = await ctx.db
        .query("users")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", id))
        .unique();
      return u?._id;
    };

    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const fields = {
        number: r.number,
        title: r.title,
        slug: r.slug,
        city: r.city,
        country: r.country,
        countryCode: r.countryCode,
        startDate: toEpochRequired(r.startDate),
        endDate: toEpoch(r.endDate ?? undefined),
        hostName: r.hostName ?? undefined,
        hostLabId: await resolveLab(r.hostLabLegacyId),
        summary: r.summary ?? undefined,
        content: r.content ?? undefined,
        status: r.status,
        coverAssetId: await resolveAsset(r.coverAssetLegacyId),
        topicsPdfAssetId: await resolveAsset(r.topicsPdfAssetLegacyId),
        authorId: await resolveUser(r.authorLegacyId),
        createdAt: toEpochRequired(r.createdAt),
        updatedAt: toEpochRequired(r.updatedAt),
        publishedAt: toEpoch(r.publishedAt ?? undefined),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("meetings")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("meetings", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── MEETING ASSETS ──────────────────────────────────────────────────
export const importMeetingAssets = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        meetingLegacyId: v.string(),
        assetLegacyId: v.string(),
        sortOrder: v.number(),
        createdAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const meeting = await ctx.db
        .query("meetings")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.meetingLegacyId))
        .unique();
      const asset = await ctx.db
        .query("assets")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.assetLegacyId))
        .unique();
      if (!meeting || !asset) {
        throw new Error(`meetingAsset ${r.legacyId}: FK missing`);
      }
      const fields = {
        meetingId: meeting._id,
        assetId: asset._id,
        sortOrder: r.sortOrder,
        createdAt: toEpochRequired(r.createdAt),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("meetingAssets")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("meetingAssets", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── NEWS POSTS ──────────────────────────────────────────────────────
export const importNewsPosts = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        title: v.string(),
        slug: v.string(),
        excerpt: v.optional(v.union(v.string(), v.null())),
        content: v.optional(v.union(v.any(), v.null())),
        status: v.union(
          v.literal("DRAFT"),
          v.literal("PUBLISHED"),
          v.literal("ARCHIVED"),
        ),
        coverAssetLegacyId: v.optional(v.union(v.string(), v.null())),
        authorName: v.optional(v.union(v.string(), v.null())),
        authorLegacyId: v.optional(v.union(v.string(), v.null())),
        createdAt: v.string(),
        updatedAt: v.string(),
        publishedAt: v.optional(v.union(v.string(), v.null())),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const coverAssetId = r.coverAssetLegacyId
        ? (
            await ctx.db
              .query("assets")
              .withIndex("by_legacyId", (q) =>
                q.eq("legacyId", r.coverAssetLegacyId as string),
              )
              .unique()
          )?._id
        : undefined;
      const authorId = r.authorLegacyId
        ? (
            await ctx.db
              .query("users")
              .withIndex("by_legacyId", (q) =>
                q.eq("legacyId", r.authorLegacyId as string),
              )
              .unique()
          )?._id
        : undefined;
      const fields = {
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt ?? undefined,
        content: r.content ?? undefined,
        status: r.status,
        coverAssetId,
        authorName: r.authorName ?? undefined,
        authorId,
        createdAt: toEpochRequired(r.createdAt),
        updatedAt: toEpochRequired(r.updatedAt),
        publishedAt: toEpoch(r.publishedAt ?? undefined),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("newsPosts")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("newsPosts", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── NEWS ASSETS ─────────────────────────────────────────────────────
export const importNewsAssets = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        newsPostLegacyId: v.string(),
        assetLegacyId: v.string(),
        sortOrder: v.number(),
        createdAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const newsPost = await ctx.db
        .query("newsPosts")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.newsPostLegacyId))
        .unique();
      const asset = await ctx.db
        .query("assets")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.assetLegacyId))
        .unique();
      if (!newsPost || !asset) continue;
      const fields = {
        newsPostId: newsPost._id,
        assetId: asset._id,
        sortOrder: r.sortOrder,
        createdAt: toEpochRequired(r.createdAt),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("newsAssets")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("newsAssets", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── CONTACT MESSAGES ────────────────────────────────────────────────
export const importContactMessages = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        name: v.string(),
        email: v.string(),
        message: v.string(),
        status: v.string(),
        createdAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const fields = {
        name: r.name,
        email: r.email,
        message: r.message,
        status: r.status,
        createdAt: toEpochRequired(r.createdAt),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("contactMessages")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("contactMessages", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── PILA INDICATORS ─────────────────────────────────────────────────
export const importPilaIndicators = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        code: v.string(),
        name: v.string(),
        formula: v.string(),
        numeratorLabel: v.string(),
        denominatorLabel: v.string(),
        considerations: v.optional(v.union(v.string(), v.null())),
        exclusions: v.optional(v.union(v.string(), v.null())),
        sortOrder: v.number(),
        isActive: v.boolean(),
        createdAt: v.string(),
        updatedAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const fields = {
        code: r.code,
        name: r.name,
        formula: r.formula,
        numeratorLabel: r.numeratorLabel,
        denominatorLabel: r.denominatorLabel,
        considerations: r.considerations ?? undefined,
        exclusions: r.exclusions ?? undefined,
        sortOrder: r.sortOrder,
        isActive: r.isActive,
        createdAt: toEpochRequired(r.createdAt),
        updatedAt: toEpochRequired(r.updatedAt),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("pilaIndicators")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("pilaIndicators", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── PILA REPORTS ────────────────────────────────────────────────────
export const importPilaReports = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        labLegacyId: v.string(),
        submittedByLegacyId: v.optional(v.union(v.string(), v.null())),
        reviewedByLegacyId: v.optional(v.union(v.string(), v.null())),
        year: v.number(),
        month: v.number(),
        status: v.union(
          v.literal("DRAFT"),
          v.literal("SUBMITTED"),
          v.literal("REVIEWED"),
        ),
        notes: v.optional(v.union(v.string(), v.null())),
        createdAt: v.string(),
        updatedAt: v.string(),
        submittedAt: v.optional(v.union(v.string(), v.null())),
        reviewedAt: v.optional(v.union(v.string(), v.null())),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const lab = await ctx.db
        .query("labs")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.labLegacyId))
        .unique();
      if (!lab) throw new Error(`pilaReport ${r.legacyId}: lab missing`);
      const submittedById = r.submittedByLegacyId
        ? (
            await ctx.db
              .query("users")
              .withIndex("by_legacyId", (q) =>
                q.eq("legacyId", r.submittedByLegacyId as string),
              )
              .unique()
          )?._id
        : undefined;
      const reviewedById = r.reviewedByLegacyId
        ? (
            await ctx.db
              .query("users")
              .withIndex("by_legacyId", (q) =>
                q.eq("legacyId", r.reviewedByLegacyId as string),
              )
              .unique()
          )?._id
        : undefined;
      const fields = {
        labId: lab._id,
        submittedById,
        reviewedById,
        year: r.year,
        month: r.month,
        status: r.status,
        notes: r.notes ?? undefined,
        createdAt: toEpochRequired(r.createdAt),
        updatedAt: toEpochRequired(r.updatedAt),
        submittedAt: toEpoch(r.submittedAt ?? undefined),
        reviewedAt: toEpoch(r.reviewedAt ?? undefined),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("pilaReports")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("pilaReports", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── PILA REPORT VALUES ──────────────────────────────────────────────
export const importPilaReportValues = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        reportLegacyId: v.string(),
        indicatorLegacyId: v.string(),
        numerator: v.optional(v.union(v.number(), v.null())),
        denominator: v.optional(v.union(v.number(), v.null())),
        doesNotReport: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const report = await ctx.db
        .query("pilaReports")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.reportLegacyId))
        .unique();
      const indicator = await ctx.db
        .query("pilaIndicators")
        .withIndex("by_legacyId", (q) =>
          q.eq("legacyId", r.indicatorLegacyId),
        )
        .unique();
      if (!report || !indicator) continue;
      const fields = {
        reportId: report._id,
        indicatorId: indicator._id,
        numerator: r.numerator ?? undefined,
        denominator: r.denominator ?? undefined,
        doesNotReport: r.doesNotReport,
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("pilaReportValues")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("pilaReportValues", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── PILA PUBLISHED REPORTS ──────────────────────────────────────────
export const importPilaPublishedReports = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        year: v.number(),
        month: v.number(),
        storagePath: v.string(),
        storageId: v.optional(v.union(v.id("_storage"), v.null())),
        filename: v.string(),
        sizeBytes: v.optional(v.union(v.number(), v.null())),
        publishedByLegacyId: v.string(),
        createdAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    let updated = 0;
    for (const r of rows) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_legacyId", (q) =>
          q.eq("legacyId", r.publishedByLegacyId),
        )
        .unique();
      if (!user) continue;
      const fields = {
        year: r.year,
        month: r.month,
        storagePath: r.storagePath,
        storageId: r.storageId ?? undefined,
        filename: r.filename,
        sizeBytes: r.sizeBytes ?? undefined,
        publishedById: user._id,
        createdAt: toEpochRequired(r.createdAt),
        legacyId: r.legacyId,
      };
      const existing = await ctx.db
        .query("pilaPublishedReports")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        updated++;
      } else {
        await ctx.db.insert("pilaPublishedReports", fields);
        inserted++;
      }
    }
    return { inserted, updated };
  },
});

// ─── AUDIT EVENTS ────────────────────────────────────────────────────
export const importAuditEvents = mutation({
  args: {
    secret: v.string(),
    rows: v.array(
      v.object({
        legacyId: v.string(),
        userLegacyId: v.optional(v.union(v.string(), v.null())),
        action: v.string(),
        entity: v.optional(v.union(v.string(), v.null())),
        entityId: v.optional(v.union(v.string(), v.null())),
        metadata: v.optional(v.union(v.any(), v.null())),
        createdAt: v.string(),
      }),
    ),
  },
  handler: async (ctx, { secret, rows }) => {
    assertSecret(secret);
    let inserted = 0;
    for (const r of rows) {
      const userId = r.userLegacyId
        ? (
            await ctx.db
              .query("users")
              .withIndex("by_legacyId", (q) =>
                q.eq("legacyId", r.userLegacyId as string),
              )
              .unique()
          )?._id
        : undefined;
      const existing = await ctx.db
        .query("auditEvents")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", r.legacyId))
        .unique();
      if (existing) continue;
      await ctx.db.insert("auditEvents", {
        userId,
        action: r.action,
        entity: r.entity ?? undefined,
        entityId: r.entityId ?? undefined,
        metadata: r.metadata ?? undefined,
        createdAt: toEpochRequired(r.createdAt),
        legacyId: r.legacyId,
      });
      inserted++;
    }
    return { inserted };
  },
});
