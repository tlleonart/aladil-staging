import type { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { createConvexClient } from "@/modules/core/convex/server";

export interface SessionUser {
  id: Id<"users">;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  labId: Id<"labs"> | null;
  labName: string | null;
  effectiveRole: "admin" | "director" | "reporter";
  permissions: string[];
}

export interface Context {
  convex: ConvexHttpClient;
  user: SessionUser | null;
}

export async function createContext(): Promise<Context> {
  const convex = await createConvexClient();
  let user: SessionUser | null = null;
  try {
    const me = await convex.query(api.users.me, {});
    user = me as SessionUser | null;
  } catch {
    user = null;
  }
  return { convex, user };
}
