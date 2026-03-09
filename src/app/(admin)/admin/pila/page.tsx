import { headers } from "next/headers";
import { auth } from "@/modules/core/auth/auth";
import { hasPermission } from "@/modules/core/auth/rbac";
import { PilaAdminPage, PilaPage } from "@/modules/pila/pages";

export default async function PilaRoutePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const canReadAll = await hasPermission(
    session.user.id,
    "PILA",
    "pila.read_all",
  );

  if (canReadAll) {
    return <PilaAdminPage />;
  }

  // Both reporters and directors see PilaPage
  // (directors have read-only, reporters can submit)
  const canSubmit = await hasPermission(session.user.id, "PILA", "pila.submit");

  return <PilaPage canSubmit={canSubmit} />;
}
