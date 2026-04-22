import { ORPCError, os } from "@orpc/server";
import type { Context, SessionUser } from "./context";

export const baseProcedure = os.$context<Context>();

export const publicProcedure = baseProcedure;

export const protectedProcedure = baseProcedure.use(
  async ({ context, next }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", { message: "Must be logged in" });
    }
    return next({
      context: {
        ...context,
        user: context.user as SessionUser,
      },
    });
  },
);

export const adminProcedure = protectedProcedure.use(
  async ({ context, next }) => {
    if (!context.user?.isSuperAdmin) {
      throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
    }
    return next({ context });
  },
);

export { ORPCError };
