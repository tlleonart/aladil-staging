// Server-only exports - do not import in client components
// For client components, use: import { authClient } from "@/modules/core/auth/auth-client"

export type { Session, User } from "./auth";
export { auth } from "./auth";
export {
  getUserPermissions,
  hasPermission,
  isSuperAdmin,
  requirePermission,
} from "./rbac";
