import { ORPCError } from "@orpc/server";

/**
 * Wrap a Convex call so its errors become proper ORPCError with best-effort code mapping.
 */
export async function fromConvex<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const lower = msg.toLowerCase();
    if (
      lower.includes("permission denied") ||
      lower.includes("admin access required") ||
      lower.includes("forbidden") ||
      lower.includes("account inactive") ||
      lower.includes("no tiene")
    ) {
      throw new ORPCError("FORBIDDEN", { message: msg });
    }
    if (
      lower.includes("must be logged in") ||
      lower.includes("unauthorized") ||
      lower.includes("unauthenticated")
    ) {
      throw new ORPCError("UNAUTHORIZED", { message: msg });
    }
    if (
      lower.includes("not found") ||
      lower.includes("no encontrad") ||
      lower.includes("no encontrada")
    ) {
      throw new ORPCError("NOT_FOUND", { message: msg });
    }
    throw new ORPCError("BAD_REQUEST", { message: msg });
  }
}
