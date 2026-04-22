import {
  hasPermissionSync,
  requireServerUser,
} from "@/modules/core/auth/server";
import { PilaAdminPage, PilaPage } from "@/modules/pila/pages";

export default async function PilaRoutePage() {
  const user = await requireServerUser();
  const canReadAll = hasPermissionSync(user, "pila.read_all");
  if (canReadAll) {
    return <PilaAdminPage />;
  }
  const canSubmit = hasPermissionSync(user, "pila.submit");
  return <PilaPage canSubmit={canSubmit} />;
}
