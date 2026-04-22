import "server-only";
import { redirect } from "next/navigation";
import {
  isAuthenticatedNextjs,
} from "@convex-dev/auth/nextjs/server";
import { api } from "@/../convex/_generated/api";
import { createConvexClient } from "@/modules/core/convex/server";

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  labId: string | null;
  labName: string | null;
  effectiveRole: "admin" | "director" | "reporter";
  permissions: string[];
}

export async function getServerUser(): Promise<ServerUser | null> {
  if (!(await isAuthenticatedNextjs())) return null;
  const convex = await createConvexClient();
  try {
    const me = await convex.query(api.users.me, {});
    return me as ServerUser | null;
  } catch {
    return null;
  }
}

export async function requireServerUser(
  loginPath = "/login",
): Promise<ServerUser> {
  const user = await getServerUser();
  if (!user) redirect(loginPath);
  return user;
}

export function hasPermissionSync(
  user: ServerUser,
  permissionKey: string,
): boolean {
  if (user.isSuperAdmin) return true;
  return user.permissions.includes(permissionKey);
}
