import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { auth } from "./auth";
import { checkPermission, type ProjectKey } from "./rbac";

export class AuthError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" = "UNAUTHORIZED",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Returns the current user's id; throws 401 if unauthenticated. */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new AuthError("Must be logged in", "UNAUTHORIZED");
  const user = await ctx.db.get(userId);
  if (!user || user.isActive === false) {
    throw new AuthError("Account inactive", "FORBIDDEN");
  }
  return userId;
}

/** Returns the current user's id; throws 403 if not super-admin. */
export async function requireSuperAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<Id<"users">> {
  const userId = await requireAuth(ctx);
  const user = await ctx.db.get(userId);
  if (!user?.isSuperAdmin) {
    throw new AuthError("Admin access required", "FORBIDDEN");
  }
  return userId;
}

/** Enforce `permissionKey` within `projectKey`; throws 403 if denied. */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  projectKey: ProjectKey,
  permissionKey: string,
): Promise<Id<"users">> {
  const userId = await requireAuth(ctx);
  const allowed = await checkPermission(ctx, userId, projectKey, permissionKey);
  if (!allowed) {
    throw new AuthError(
      `Permission denied: ${permissionKey}`,
      "FORBIDDEN",
    );
  }
  return userId;
}

/** Resolve a public URL for an asset (including backward-compat Supabase URL). */
export async function resolveAssetUrl(
  ctx: QueryCtx | MutationCtx,
  asset:
    | {
        storageId?: Id<"_storage"> | null;
        legacyBucket?: string | null;
        legacyPath?: string | null;
      }
    | null
    | undefined,
): Promise<string | null> {
  if (!asset) return null;
  if (asset.storageId) {
    const url = await ctx.storage.getUrl(asset.storageId);
    if (url) return url;
  }
  // Fallback to legacy Supabase public URL if still configured (shouldn't happen in prod).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (asset.legacyBucket && asset.legacyPath && supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${asset.legacyBucket}/${asset.legacyPath}`;
  }
  return null;
}
