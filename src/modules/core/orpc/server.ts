import { ORPCError, os } from "@orpc/server";
import { prisma } from "@/modules/core/db";
import type { Context } from "./context";

// Base procedure with context
export const baseProcedure = os.$context<Context>();

// Public procedure - no auth required
export const publicProcedure = baseProcedure;

// Protected procedure - requires authenticated session
export const protectedProcedure = baseProcedure.use(
  async ({ context, next }) => {
    if (!context.session?.user) {
      throw new ORPCError("UNAUTHORIZED", { message: "Must be logged in" });
    }

    return next({
      context: {
        ...context,
        session: context.session,
        user: context.session.user,
      },
    });
  },
);

// Admin procedure - requires super admin status
export const adminProcedure = protectedProcedure.use(
  async ({ context, next }) => {
    const user = await prisma.user.findUnique({
      where: { id: context.user.id },
      select: { isSuperAdmin: true },
    });

    if (!user?.isSuperAdmin) {
      throw new ORPCError("FORBIDDEN", { message: "Admin access required" });
    }

    return next({ context });
  },
);

export { ORPCError };
