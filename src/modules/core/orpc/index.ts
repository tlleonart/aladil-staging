// Client-safe exports only - do NOT export server-side code here
// Server-side code should be imported directly: @/modules/core/orpc/server, etc.
export { orpc } from "./client";
export type { Context } from "./context";
export { QueryProvider, useMutation, useQuery, useQueryClient } from "./react";
// Type-only exports (these are stripped at compile time)
export type { AppRouter } from "./router";
