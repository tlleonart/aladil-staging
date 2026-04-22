"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

/**
 * React hook that exposes the currently authenticated user (via api.users.me),
 * in a shape compatible with the previous Better-Auth `useSession` usage.
 */
export function useSession() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const session =
    isAuthenticated && me
      ? {
          user: {
            id: me.id,
            email: me.email,
            name: me.name,
          },
        }
      : null;
  return { data: session, isPending: isLoading };
}

/**
 * Convenience wrapper that mimics the previous `authClient` API surface so
 * existing components keep compiling. Uses Convex Auth Password provider.
 */
export const authClient = {
  signIn: {
    email: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
      callbackURL?: string;
    }) => {
      // Should not be used directly; kept for compat. Prefer useAuthActions().signIn.
      throw new Error(
        "authClient.signIn.email is not available outside React context. Use useAuthActions().signIn instead.",
      );
    },
  },
  signOut: async () => {
    throw new Error(
      "authClient.signOut is not available outside React context. Use useAuthActions().signOut instead.",
    );
  },
};

export { useAuthActions };
