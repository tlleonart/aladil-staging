import type { ProjectKey } from "@prisma/client";
import { prisma } from "@/modules/core/db";

export async function getUserPermissions(
  userId: string,
  projectKey: ProjectKey,
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: {
          isActive: true,
          project: { key: projectKey },
        },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return [];
  if (user.isSuperAdmin) return ["*"]; // Bypass all checks

  return user.memberships.flatMap((m) =>
    m.role.permissions.map((rp) => rp.permission.key),
  );
}

export async function hasPermission(
  userId: string,
  projectKey: ProjectKey,
  permissionKey: string,
): Promise<boolean> {
  const permissions = await getUserPermissions(userId, projectKey);
  return permissions.includes("*") || permissions.includes(permissionKey);
}

export async function requirePermission(
  userId: string | undefined,
  projectKey: ProjectKey,
  permissionKey: string,
): Promise<void> {
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  const allowed = await hasPermission(userId, projectKey, permissionKey);
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  return user?.isSuperAdmin ?? false;
}
