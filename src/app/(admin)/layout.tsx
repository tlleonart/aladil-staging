import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/modules/admin/components";
import { auth } from "@/modules/core/auth/auth";
import { QueryProvider } from "@/modules/core/orpc";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email,
  };

  return (
    <QueryProvider>
      <AdminShell user={user}>{children}</AdminShell>
    </QueryProvider>
  );
}
